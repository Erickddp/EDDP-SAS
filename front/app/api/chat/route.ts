import { NextResponse } from "next/server";
import { MockEngine } from "@/lib/mock-engine";
import { ChatRequest, ChatResponse, StructuredAnswer, AdaptiveDebugMeta, CitationEntry, FoundationEntry } from "@/lib/types";
import { tokenizeQuery } from "@/lib/legal-search";
import { buildLegalContext, RetrievalContext } from "@/lib/context-builder";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { buildSystemPrompt, buildUserPrompt, getEffectiveDepthRule, FOLLOW_UP_TOKEN_MULTIPLIER } from "@/lib/llm-prompt";
import { parseLegalReference } from "@/lib/law-alias";
import { analyzeQueryWithDebug } from "@/lib/query-analyzer";
import { RETRIEVAL_CONFIG } from "@/lib/retrieval-config";
import { getConversationContext, updateConversationContext, detectFollowUp } from "@/lib/conversation-context";
import { getSession, updateSessionData } from "@/lib/session";
import { buildRetrievalPlan } from "@/lib/retrieval-optimizer";
import { filterArticlesByRelevance } from "@/lib/article-relevance";
import { extractArticleFragments } from "@/lib/article-fragment";
import { rankLegalAuthority, RankedArticle } from "@/lib/legal-authority-ranker";
import { PlanType, GUEST_LIMIT, PLAN_LIMITS } from "@/lib/saas-constants";


import { getSubscriptionByUserId, getUserById } from "@/lib/user-storage";

import { checkUsageLimit, incrementUsage } from "@/lib/usage-enforcer";
import { logUsage } from "@/lib/observability";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";
import { saveConversation, saveMessage as saveChatMsg } from "@/lib/chat-storage";
import { performIterativeRetrieval } from "@/lib/retrieval/iterative-engine";


export async function POST(req: Request) {
    const methodError = validatedMethod(req, ["POST"]);
    if (methodError) return methodError;

    const startTime = Date.now();
    let userId = "unknown";
    let plan = "gratis";
    let isGuest = true;

    try {
        const session = await getSession();
        let body: ChatRequest;
        
        try {
            body = await req.json();
        } catch (e) {
            return handleApiError(new Error("Payload JSON inválido"), AppErrorType.VALIDATION);
        }

        if (!body.message || !body.conversationId) {
            return handleApiError(new Error("Mensaje u ID de conversación faltante"), AppErrorType.VALIDATION);
        }

        // ──────────────────────────────────────────────────────────────────
        // SaaS: Usage Limit Check (Real-time from DB)
        // ──────────────────────────────────────────────────────────────────
        isGuest = !session || session.role === "guest";
        userId = isGuest ? ("anonymous-guest-" + (req.headers.get("x-forwarded-for") || "local")) : (session?.id || "unknown");
        
        if (!isGuest && session?.id) {
            const subscription = await getSubscriptionByUserId(session.id);
            const now = new Date();
            const isPeriodValid = !subscription?.current_period_end || new Date(subscription.current_period_end) > now;
            const isStatusValid = subscription?.status === 'active' || subscription?.status === 'trialing';
            
            plan = (isStatusValid && isPeriodValid) ? (subscription?.plan_type || "gratis") : "gratis";
        } else {
            plan = "gratis";
        }

        const { allowed, remaining, total } = await checkUsageLimit(userId, plan as PlanType, isGuest);
        
        if (!allowed) {
            return NextResponse.json({ 
                error: "Límite de consultas alcanzado", 
                code: isGuest ? "GUEST_LIMIT_REACHED" : "USAGE_LIMIT_EXCEEDED",
                details: isGuest 
                    ? `Has agotado tus ${GUEST_LIMIT} consultas como invitado. Regístrate gratis para obtener más.` 
                    : `Has usado todas tus consultas (${total}) para tu plan ${plan}. Por favor, actualiza tu plan para continuar.`,
                limitReached: true,
                total,
                remaining
            }, { status: 402 });
        }

        // Phase 8: Legacy Guard Sync (using the same logic now)
        if (isGuest && (session?.questionCount || 0) >= GUEST_LIMIT) {
            return NextResponse.json({ 
                error: "Límite de prueba alcanzado", 
                code: "GUEST_LIMIT_REACHED",
                message: `Has alcanzado el límite de ${GUEST_LIMIT} consultas como invitado. Regístrate o usa Google para continuar.` 
            }, { status: 403 });
        }

        // Phase 7: Profile context for AI
        let userContext: { name: string; role: string; plan?: string; professionalProfile?: string | null } | undefined = undefined;

        if (session) {
            userContext = {
                name: session.name,
                role: session.role,
                plan: session.plan,
                professionalProfile: session.professionalProfile
            };
        } else if (req.headers.get('x-test-bypass') === process.env.SESSION_SECRET && body.userId) {
            // Bypass user context recovery for testing
            const testUser = await getUserById(body.userId);
            if (testUser) {
                userContext = {
                    name: testUser.name,
                    role: testUser.role,
                    plan: testUser.plan,
                    professionalProfile: testUser.professionalProfile
                };
            }
        }


        // ──────────────────────────────────────────────────────────────────
        // 0. Conversation Memory — detect follow-ups
        // ──────────────────────────────────────────────────────────────────
        const previousContext = getConversationContext(body.conversationId);
        const followUpResult = detectFollowUp(body.message, previousContext);

        console.log(`\n┌──────── CONVERSATION MEMORY ────────┐`);
        console.log(`│ ConvID: ${body.conversationId.slice(0, 8)}...`);
        console.log(`│ FollowUp: ${followUpResult.isFollowUp} (${followUpResult.reason})`);
        if (previousContext) {
            console.log(`│ Previous: topic=${previousContext.lastTopic} intent=${previousContext.lastIntent} law=${previousContext.lastLaw}`);
        } else {
            console.log(`│ Previous: none`);
        }
        console.log(`└─────────────────────────────────────┘`);

        // Build effective query
        const history = body.history || [];
        let effectiveQuery = body.message;

        if (followUpResult.isFollowUp && previousContext) {
            // For follow-ups, enrich the query with previous context
            effectiveQuery = `${previousContext.lastQuery} | Seguimiento: ${body.message}`;
        } else if (history.length > 0) {
            // Legacy follow-up detection (keep for backward compat)
            const lastUserMessage = [...history].reverse().find(m => m.role === "user")?.content;
            const msg = body.message.toLowerCase().trim();
            const isLegacyFollowUp = msg.startsWith("y ") ||
                msg.startsWith("¿y ") ||
                msg.length < 20 ||
                msg.includes("eso") ||
                msg.includes("esta") ||
                msg.includes("este");
            if (isLegacyFollowUp && lastUserMessage) {
                effectiveQuery = `${lastUserMessage} | Seguimiento: ${body.message}`;
            }
        }

        // 0.5. Extraer intención determinista de artículos / leyes 
        const parsedRef = parseLegalReference(effectiveQuery);

        // ──────────────────────────────────────────────────────────────────
        // 1. Query Analysis — classify complexity and get config + debug
        // ──────────────────────────────────────────────────────────────────
        const { analysis: queryAnalysis, debug: queryDebug } = analyzeQueryWithDebug(effectiveQuery, body.mode, body.detailLevel);
        const tierConfig = RETRIEVAL_CONFIG[queryAnalysis.complexity];

        // Ensure token limit supports maxWords requested by depth rule
        const depthRule = getEffectiveDepthRule(queryAnalysis.detail, followUpResult.isFollowUp);
        // ~2.5 tokens per word + JSON overhead
        const safeTokenLimit = Math.max(tierConfig.tokens, Math.floor(depthRule.maxWords * 2.5) + 150);

        // Token limit reduction for follow-ups
        const effectiveTokenLimit = followUpResult.isFollowUp
            ? Math.floor(safeTokenLimit * FOLLOW_UP_TOKEN_MULTIPLIER)
            : safeTokenLimit;

        // 1.5. Build Retrieval Plan (Dynamic Limits, Diversity, Priority)
        const hasExactMatchRef = !!parsedRef.lawAbbreviation && !!parsedRef.articleNumber;
        const retrievalPlan = buildRetrievalPlan(
            queryAnalysis,
            followUpResult.isFollowUp,
            hasExactMatchRef,
            tierConfig.articles,
            previousContext
        );

        // ──────────────────────────────────────────────────────────────────
        // 2. Obtener contexto legal — context-aware retrieval for follow-ups
        // ──────────────────────────────────────────────────────────────────
        let context: RetrievalContext;
        const effectiveRetrievalStrategy = retrievalPlan.strategyLabel;
        let wasIterative = false;
        let passCount = 1;
        let iterativeTokens = 0;
        let iterationTasks: string[] = [];


        const userPlanConfig = PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.gratis;
        const canUseIterative = userPlanConfig.canUseAdvancedRAG;

        const isComplex = queryAnalysis.complexity === "complex" || 
                         (queryAnalysis.structuredIntent?.legalDomain === "fiscal" && queryAnalysis.structuredIntent.intentType === "calculo") ||
                         queryDebug.multiLawRef;

        if (isComplex && !followUpResult.isFollowUp && canUseIterative) {
            console.log(`📡 [ITERATIVE ROUTER] High Complexity detected. Triggering Multi-Pass RAG...`);

            try {
                // Timeout safety for iterative engine (15s)
                const iterativePromise = performIterativeRetrieval(effectiveQuery);
                const timeoutPromise = new Promise<{ articles: any[], wasIterative: boolean, passCount: number }>((_, reject) => 
                    setTimeout(() => reject(new Error("Iterative retrieval timeout")), 15000)
                );

                const iterativeResult = await Promise.race([iterativePromise, timeoutPromise]) as any;
                
                wasIterative = iterativeResult.wasIterative;
                passCount = iterativeResult.passCount;
                iterationTasks = iterativeResult.tasks || [];

                
                // Estimate tokens used in decomposition/sufficiency (Round trip ~800-1200 tokens)
                iterativeTokens = wasIterative ? 1200 : 500;

                context = {
                    topic: queryAnalysis.structuredIntent?.topic || "fiscal",
                    retrievedArticles: iterativeResult.articles.slice(0, tierConfig.articles),
                    foundation: [],
                    sources: iterativeResult.articles.map((art: any) => ({
                        id: art.id,
                        title: `${art.documentAbbreviation} Art. ${art.articleNumber}`,
                        type: "Articulo",
                        status: "Vigente",
                        articleRef: `${art.documentAbbreviation} ${art.articleNumber}`,
                        text: art.text,
                        fragments: art.fragments
                    })),
                    retrievalMeta: {
                        strategy: wasIterative ? "iterative-multipass" : "iterative-singlepass",
                        totalMatches: iterativeResult.articles.length
                    }
                };
            } catch (iterationErr) {
                console.warn("⚠️ [ITERATIVE ROUTER] Fallback to linear retrieval due to:", iterationErr);
                context = await buildLegalContext(
                    effectiveQuery,
                    parsedRef,
                    Math.max(12, retrievalPlan.effectiveArticleLimit * 2),
                    retrievalPlan.excludeArticleIds,
                    retrievalPlan.preferredLaw
                );
            }
        } else {
            // Standard Linear Retrieval (Fase 3)
            if (followUpResult.isFollowUp && previousContext) {
                const enrichedQuery = `${previousContext.lastLaw} ${body.message}`;
                context = await buildLegalContext(
                    enrichedQuery,
                    parsedRef,
                    Math.max(8, retrievalPlan.effectiveArticleLimit * 2),
                    retrievalPlan.excludeArticleIds,
                    retrievalPlan.preferredLaw
                );
            } else {
                context = await buildLegalContext(
                    effectiveQuery,
                    parsedRef,
                    Math.max(12, retrievalPlan.effectiveArticleLimit * 2),
                    retrievalPlan.excludeArticleIds,
                    retrievalPlan.preferredLaw
                );
            }
        }


        // 2.5. Apply Legal Intent Relevance Filter
        if (queryAnalysis.structuredIntent) {
            const originalCount = context.retrievedArticles.length;
            context.retrievedArticles = filterArticlesByRelevance(
                context.retrievedArticles,
                queryAnalysis.structuredIntent,
                body.message
            );
            
            // Re-sync sources after filtering
            context.sources = context.retrievedArticles.map((art: any) => ({
                id: art.id,
                title: `${art.documentAbbreviation} Art. ${art.articleNumber}`,
                type: "Articulo",
                status: "Vigente",
                articleRef: `${art.documentAbbreviation} ${art.articleNumber}`,
                text: art.text,
                fragments: art.fragments
            }));

            console.log(`│ Relevance Filter: ${originalCount} → ${context.retrievedArticles.length} articles remaining`);
        }

        // 2.7. Extract Article Fragments for LLM Context
        if (queryAnalysis.structuredIntent) {
            context.retrievedArticles = context.retrievedArticles.map((art: any) => ({
                ...art,
                fragments: extractArticleFragments(
                    art,
                    queryAnalysis.structuredIntent!,
                    body.message,
                    3 // Increased fragment limit
                )
            }));
            console.log(`│ Fragment Extraction: Extracted relevant fragments for ${context.retrievedArticles.length} articles`);
        }

        // 2.8. Phase 7B: Legal Authority Ranking & Pruning
        let ranking: { primary: RankedArticle | null; supporting: RankedArticle[]; rejected: RankedArticle[] } = { 
            primary: null, 
            supporting: context.retrievedArticles.slice(0, tierConfig.articles).map((a: any) => ({ 
                article: a, 
                reasons: ["Fallback"], 
                role: "correlation",
                score: 0.5,
                isPrimary: false
            })), 
            rejected: [] 
        };

        if (queryAnalysis.structuredIntent) {
            ranking = rankLegalAuthority(
                body.message,
                queryAnalysis.structuredIntent,
                queryAnalysis,
                context.retrievedArticles,
                history
            );

            // Update context with ranked and pruned articles
            const rankedArticles = [];
            if (ranking.primary) rankedArticles.push(ranking.primary.article);
            ranking.supporting.forEach((ra: RankedArticle) => rankedArticles.push(ra.article));

            context.retrievedArticles = rankedArticles;
            
            // Re-sync sources after ranking/pruning
            context.sources = context.retrievedArticles.map((art: any) => ({
                id: art.id,
                title: `${art.documentAbbreviation} Art. ${art.articleNumber}`,
                type: "Articulo",
                status: "Vigente",
                articleRef: `${art.documentAbbreviation} ${art.articleNumber}`,
                text: art.text,
                fragments: art.fragments
            }));

            console.log(`│ Authority Ranking: primary=${ranking.primary?.article.id || "none"} supporting=${ranking.supporting.length} rejected=${ranking.rejected.length}`);
        }

        // 3. Generar respuesta (OpenAI con fallback a MockEngine)
        let answer: StructuredAnswer;
        let mockResult = null;

        // Determinar estrategia exacta
        const hasExactMatch = !!parsedRef.lawAbbreviation && !!parsedRef.articleNumber && context.retrievedArticles.length > 0;
        const retrievalStrategy = hasExactMatch ? 'exact-law-article' : context.retrievalMeta.strategy;
        const finalRetrievalStrategy = effectiveRetrievalStrategy === "context-aware" ? "context-aware" : retrievalStrategy;

        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: OPENAI_MODEL,
                    messages: [
                        {
                            role: "system", content: buildSystemPrompt({
                                message: body.message,
                                mode: body.mode,
                                detailLevel: body.detailLevel,
                                topic: context.topic,
                                legalContext: context.retrievedArticles,
                                history: body.history,
                                retrievalStrategy: finalRetrievalStrategy === "context-aware" ? retrievalStrategy : retrievalStrategy,
                                parsedRef,
                                queryAnalysis,
                                isFollowUp: followUpResult.isFollowUp,
                                previousTopic: previousContext?.lastTopic,
                                userContext
                            })
                        },
                        {
                            role: "user", content: buildUserPrompt({
                                message: body.message,
                                mode: body.mode,
                                detailLevel: body.detailLevel,
                                topic: context.topic,
                                legalContext: context.retrievedArticles,
                                history: body.history,
                                retrievalStrategy,
                                parsedRef,
                                queryAnalysis,
                                isFollowUp: followUpResult.isFollowUp,
                                previousTopic: previousContext?.lastTopic
                            })
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.2,
                    max_tokens: effectiveTokenLimit
                });

                const content = response.choices[0].message.content;
                if (!content) throw new Error("Respuesta de OpenAI vacía");

                answer = JSON.parse(content);
            } catch (err) {
                console.error("OpenAI Error:", err);
                mockResult = await MockEngine.processChat(body, context.topic);
                answer = mockResult.answer;
            }
        } else {
            mockResult = await MockEngine.processChat(body, context.topic);
            answer = mockResult.answer;
        }

        // 4. Integrar artículos en la respuesta estructurada
        const sources = context.sources.length > 0 ? context.sources : (mockResult?.sources || []);

        // 4.1. Citation Validation & Traceability
        const retrievedArticleIds = new Set(context.retrievedArticles.map((a: any) => a.id));
        const validCitations: CitationEntry[] = [];
        let invalidCitationsRemoved = 0;

        if (Array.isArray(answer.citations)) {
            (answer.citations as CitationEntry[]).forEach((cit) => {
                if (cit.sourceId && retrievedArticleIds.has(cit.sourceId)) {
                    validCitations.push(cit);
                } else {
                    invalidCitationsRemoved++;
                }
            });
        }
        
        answer.citations = validCitations;
        
        const primaryCitationsCount = validCitations.filter(c => c.type === "primary").length;
        const supportingCitationsCount = validCitations.filter(c => c.type === "supporting").length;
        
        let traceabilityValidated = false;
        if (Array.isArray(answer.summaryCitations) && answer.summaryCitations.length > 0) {
            traceabilityValidated = answer.summaryCitations.some(ref => 
                validCitations.some(c => c.ref === ref && c.type === "primary")
            );
        }

        // 4.2 Legacy Foundation 
        const modelFoundation = Array.isArray(answer.foundation) ? answer.foundation.filter(Boolean) : [];
        const fallbackFoundationRaw = mockResult?.answer.foundation || context.foundation || [];
        const foundation = modelFoundation.length > 0 ? modelFoundation : (fallbackFoundationRaw as (string | FoundationEntry)[]).map((item) => 
            typeof item === "string" ? { type: "primary" as const, ref: item } : item
        );

        // 5. Sugerencia de título
        const titleSuggestion = mockResult?.titleSuggestion || "Consulta Fiscal";

        // 6. Update conversation memory for next turn
        updateConversationContext(
            body.conversationId,
            context.topic,
            queryAnalysis.detectedIntent,
            context.retrievedArticles.map((a: any) => `${a.documentAbbreviation} Art. ${a.articleNumber}`),
            context.retrievedArticles.map((a: any) => a.id),
            context.retrievedArticles[0]?.documentAbbreviation || "general",
            body.message
        );

        // ─── Build debug metadata ────────────────────────────────────────
        const debugMeta: AdaptiveDebugMeta = {
            queryDebug,
            retrievalRequested: tierConfig.articles,
            retrievalReturned: context.retrievedArticles.length,
            topSources: context.sources.slice(0, 5).map((s: any) => s.title),
            tokenLimit: effectiveTokenLimit,
            promptComplexity: queryAnalysis.complexity,
            promptMode: queryAnalysis.mode,
            promptDetail: queryAnalysis.detail,
            detectedIntent: queryAnalysis.detectedIntent,
            followUpDetected: followUpResult.isFollowUp,
            followUpReason: followUpResult.reason,
            reusedTopic: followUpResult.isFollowUp ? (previousContext?.lastTopic || null) : null,
            depthRulesApplied: true,
            targetMinWords: depthRule.minWords,
            targetMaxWords: depthRule.maxWords,
            followUpCompressionApplied: followUpResult.isFollowUp,
            compressedTokenLimit: followUpResult.isFollowUp ? effectiveTokenLimit : null,
            compressedWordLimit: followUpResult.isFollowUp ? depthRule.maxWords : null,
            retrievedArticlesCount: context.retrievedArticles.length,
            retrievalStrategy: finalRetrievalStrategy,
            articleDiversityApplied: retrievalPlan.diversityApplied,
            previousArticlesExcluded: retrievalPlan.previousArticlesExcluded,
            responseSections: Object.keys(answer),
            summaryLength: answer.summary ? answer.summary.split(/\s+/).length : 0,
            foundationCount: Array.isArray(foundation) ? foundation.length : 0,
            exampleIncluded: !!answer.example,
            citationsCount: validCitations.length,
            primaryCitationsCount,
            supportingCitationsCount,
            traceabilityValidated,
            invalidCitationsRemoved,
            // Phase 7B
            authorityRankingApplied: true,
            primaryBasisRef: ranking.primary?.article.id,
            primaryBasisLaw: ranking.primary?.article.documentAbbreviation,
            primaryBasisWhy: ranking.primary?.reasons[0],
            supportingBasisRefs: ranking.supporting?.map((s) => s.article.id),
            supportingBasisLaws: ranking.supporting?.map((s) => s.article.documentAbbreviation),
            rejectedBasisRefs: ranking.rejected?.map((s) => s.article.id),
            mainPriorityApplied: true,
            subsectionPrecisionApplied: true
        };

        const chatResponse: ChatResponse = {
            answer: {
                ...answer,
                foundation,
                certainty: answer.certainty || (context.retrievedArticles.length > 0 ? `Basado en ${context.retrievedArticles.length} artículo(s)` : "Referencia normativa"),
                disclaimer: answer.disclaimer || "Esta respuesta se basa en análisis automatizado de artículos fiscales."
            },
            sources: context.sources,
            titleSuggestion,
            queryAnalysis,
            _debug: {
                ...debugMeta,
                wasIterative,
                passCount,
                iterativeTokens,
                iterationTasks
            }

        };



        const finalResponse = chatResponse;

        console.log(`│ API Response: ${chatResponse.answer.primaryBasis?.ref || "no primary"} | primaryBasisLaw: ${debugMeta.primaryBasisLaw}`);
        
        // ──────────────────────────────────────────────────────────────────
        // SaaS: Usage Tracking & Observability
        // ──────────────────────────────────────────────────────────────────
        if (!isGuest) {
            await incrementUsage(userId);
        }
        
        await logUsage({
            userId: userId,
            conversationId: body.conversationId,
            promptTokens: iterativeTokens, // Pre-calculate iterative overhead
            completionTokens: 0,
            model: OPENAI_MODEL || "mock",
            durationMs: Date.now() - startTime,
            status: "success",
            ipAddress: req.headers.get("x-forwarded-for") || "local"
        });


        // 6.5. Final Side Effects (Guest limit or DB Persistence)
        if (isGuest) {
            const currentCount = session?.questionCount || 0;
            await updateSessionData({ 
                questionCount: currentCount + 1 
            });
            console.log(`│ Guest Limit: ${currentCount + 1}/${GUEST_LIMIT} questions used`);
        } else if (userId !== "unknown") {
            try {
                await saveConversation(userId, {
                    id: body.conversationId,
                    title: (body.history?.length === 0 && titleSuggestion) ? (titleSuggestion as string) : "Consulta Fiscal",
                    mode: body.mode,
                    detailLevel: body.detailLevel,
                    archived: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });

                await saveChatMsg({
                    id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    conversationId: body.conversationId,
                    role: "user",
                    content: body.message,
                    createdAt: Date.now()
                });

                await saveChatMsg({
                    id: `asst-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    conversationId: body.conversationId,
                    role: "assistant",
                    content: chatResponse.answer,
                    sources: chatResponse.sources,
                    createdAt: Date.now()
                });
                console.log(`│ DB Storage: Persistent History updated.`);
            } catch (dbErr) {
                console.error("│ DB Storage Error:", dbErr);
            }
        }

        return NextResponse.json(finalResponse);
    } catch (error: unknown) {
        const err = error as Error;
        // Observability logging
        await logUsage({
            userId,
            conversationId: "error",
            promptTokens: 0,
            completionTokens: 0,
            model: OPENAI_MODEL || "unknown",
            durationMs: Date.now() - startTime,
            status: "error",
            errorMessage: err.message,
            ipAddress: req.headers.get("x-forwarded-for") || "local"
        });

        // Detect error type for user response
        let errorType = AppErrorType.INTERNAL;
        const appErr = err as { code?: string; status?: number; message: string };
        
        if (appErr.code && (appErr.code.startsWith("42") || appErr.code === "ECONNREFUSED")) {
            errorType = AppErrorType.DATABASE;
        } else if (appErr.status && appErr.status >= 400 && appErr.message.includes("OpenAI")) {
            errorType = AppErrorType.OPENAI;
        }

        return handleApiError(err, errorType);
    }
}
