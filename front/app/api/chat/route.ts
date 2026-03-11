import { NextResponse } from "next/server";
import { MockEngine } from "@/lib/mock-engine";
import { ChatRequest, ChatResponse, StructuredAnswer, AdaptiveDebugMeta } from "@/lib/types";
import { tokenizeQuery } from "@/lib/legal-search";
import { buildLegalContext } from "@/lib/context-builder";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { buildSystemPrompt, buildUserPrompt, getEffectiveDepthRule, FOLLOW_UP_TOKEN_MULTIPLIER } from "@/lib/llm-prompt";
import { parseLegalReference } from "@/lib/law-alias";
import { analyzeQueryWithDebug } from "@/lib/query-analyzer";
import { RETRIEVAL_CONFIG } from "@/lib/retrieval-config";
import { getConversationContext, updateConversationContext, detectFollowUp } from "@/lib/conversation-context";
import { buildRetrievalPlan } from "@/lib/retrieval-optimizer";

export async function POST(req: Request) {
    try {
        const body: ChatRequest = await req.json();

        if (!body.message || !body.conversationId) {
            return NextResponse.json({ error: "Mensaje u ID de conversación faltante" }, { status: 400 });
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

        // Token limit reduction for follow-ups
        const effectiveTokenLimit = followUpResult.isFollowUp
            ? Math.floor(tierConfig.tokens * FOLLOW_UP_TOKEN_MULTIPLIER)
            : tierConfig.tokens;

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
        let context;
        let effectiveRetrievalStrategy = retrievalPlan.strategyLabel;

        if (followUpResult.isFollowUp && previousContext) {
            // Context-aware retrieval: use previous law context to guide search
            const enrichedQuery = `${previousContext.lastLaw} ${body.message}`;
            context = await buildLegalContext(
                enrichedQuery, 
                parsedRef, 
                retrievalPlan.effectiveArticleLimit,
                retrievalPlan.excludeArticleIds,
                retrievalPlan.preferredLaw
            );
        } else {
            context = await buildLegalContext(
                effectiveQuery, 
                parsedRef, 
                retrievalPlan.effectiveArticleLimit,
                retrievalPlan.excludeArticleIds,
                retrievalPlan.preferredLaw
            );
        }

        // 3. Generar respuesta (OpenAI con fallback a MockEngine)
        let answer: StructuredAnswer;
        let mockResult = null;

        // Determinar estrategia exacta
        const hasExactMatch = !!parsedRef.lawAbbreviation && !!parsedRef.articleNumber && context.retrievedArticles.length > 0;
        const retrievalStrategy = hasExactMatch ? 'exact-law-article' : context.retrievalMeta.strategy;
        const finalRetrievalStrategy = effectiveRetrievalStrategy === "context-aware" ? "context-aware" : retrievalStrategy;

        console.log(`[Observability] Estrategia: ${finalRetrievalStrategy} | ExactMatch: ${hasExactMatch ? 'Sí' : 'No'} | Fallback: ${context.retrievalMeta.strategy}`);

        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: OPENAI_MODEL,
                    messages: [
                        { role: "system", content: buildSystemPrompt({ 
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
                            previousTopic: previousContext?.lastTopic
                        }) },
                        { role: "user", content: buildUserPrompt({ 
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
                        }) }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.2,
                    max_tokens: effectiveTokenLimit
                });

                const content = response.choices[0].message.content;
                if (!content) throw new Error("Respuesta de OpenAI vacía");
                
                answer = JSON.parse(content);
            } catch (err) {
                console.error("OpenAI Error, falling back to MockEngine:", err);
                mockResult = await MockEngine.processChat(body, context.topic);
                answer = mockResult.answer;
            }
        } else {
            mockResult = await MockEngine.processChat(body, context.topic);
            answer = mockResult.answer;
        }

        // 4. Integrar artículos en la respuesta estructurada
        const sources = context.sources.length > 0 ? context.sources : (mockResult?.sources || []);
        const modelFoundation = Array.isArray(answer.foundation) ? answer.foundation.filter(Boolean) : [];
        const normalizeRef = (value: string) =>
            value
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, " ")
                .trim();

        const sourceRefs = context.retrievedArticles.map((article) =>
            normalizeRef(`${article.documentAbbreviation} art ${article.articleNumber}`)
        );

        const modelFoundationMatchesSources = modelFoundation.some((line) => {
            const normalizedLine = normalizeRef(line);
            return sourceRefs.some((ref) => normalizedLine.includes(ref));
        });

        const foundation =
            modelFoundation.length > 0 && modelFoundationMatchesSources
                ? modelFoundation
                : (mockResult?.answer.foundation || context.foundation);

        // 5. Sugerencia de título
        let titleSuggestion = mockResult?.titleSuggestion;
        if (!titleSuggestion || titleSuggestion === "Consulta general") {
            if (context.retrievedArticles.length > 0) {
                titleSuggestion = `Análisis ${context.retrievedArticles[0].documentAbbreviation} Art. ${context.retrievedArticles[0].articleNumber}`;
            } else if (context.topic !== "general") {
                titleSuggestion = context.topic.charAt(0).toUpperCase() + context.topic.slice(1);
            } else {
                const tokens = tokenizeQuery(body.message).slice(0, 4);
                if (tokens.length > 0) {
                    titleSuggestion = tokens.join(" ").charAt(0).toUpperCase() + tokens.join(" ").slice(1);
                } else {
                    titleSuggestion = "Consulta Fiscal";
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────
        // 6. Update conversation memory for next turn
        // ──────────────────────────────────────────────────────────────────
        const primaryLaw = context.retrievedArticles.length > 0
            ? context.retrievedArticles[0].documentAbbreviation
            : previousContext?.lastLaw || "general";
        
        const sourceLabels = context.retrievedArticles.map(a => 
            `${a.documentAbbreviation} Art. ${a.articleNumber}`
        );

        const articleIds = context.retrievedArticles.map(a => a.id);

        updateConversationContext(
            body.conversationId,
            context.topic,
            queryAnalysis.detectedIntent,
            sourceLabels,
            articleIds,
            primaryLaw,
            body.message
        );

        // ─── Build debug metadata ────────────────────────────────────────
        const topSources = context.sources.slice(0, 5).map(s => s.title);
        const effectiveDepthRule = getEffectiveDepthRule(queryAnalysis.detail, followUpResult.isFollowUp);
        const debugMeta: AdaptiveDebugMeta = {
            queryDebug: queryDebug,
            retrievalRequested: tierConfig.articles,
            retrievalReturned: context.retrievedArticles.length,
            topSources,
            tokenLimit: effectiveTokenLimit,
            promptComplexity: queryAnalysis.complexity,
            promptMode: queryAnalysis.mode,
            promptDetail: queryAnalysis.detail,
            detectedIntent: queryAnalysis.detectedIntent,
            followUpDetected: followUpResult.isFollowUp,
            followUpReason: followUpResult.reason,
            reusedTopic: followUpResult.isFollowUp ? (previousContext?.lastTopic || null) : null,
            depthRulesApplied: true,
            targetMinWords: effectiveDepthRule.minWords,
            targetMaxWords: effectiveDepthRule.maxWords,
            followUpCompressionApplied: followUpResult.isFollowUp,
            compressedTokenLimit: followUpResult.isFollowUp ? effectiveTokenLimit : null,
            compressedWordLimit: followUpResult.isFollowUp ? effectiveDepthRule.maxWords : null,
            retrievedArticlesCount: context.retrievedArticles.length,
            retrievalStrategy: finalRetrievalStrategy,
            articleDiversityApplied: retrievalPlan.diversityApplied,
            previousArticlesExcluded: retrievalPlan.previousArticlesExcluded
        };

        // Enhanced observability
        console.log(`\n┌──────── ADAPTIVE ENGINE RESULT ────────┐`);
        console.log(`│ Retrieval: requested=${tierConfig.articles} returned=${context.retrievedArticles.length}`);
        console.log(`│ Top Sources: ${topSources.join(", ") || "none"}`);
        console.log(`│ Token Limit: ${effectiveTokenLimit}${followUpResult.isFollowUp ? ` (compressed from ${tierConfig.tokens})` : ""}`);
        console.log(`│ Strategy: ${finalRetrievalStrategy}`);
        console.log(`│ Intent: ${queryAnalysis.detectedIntent}`);
        console.log(`│ FollowUp: ${followUpResult.isFollowUp} → ${followUpResult.reason}`);
        console.log(`│ Depth: ${effectiveDepthRule.label} (${effectiveDepthRule.minWords}-${effectiveDepthRule.maxWords} words)`);
        if (followUpResult.isFollowUp) {
            console.log(`│ Compression: tokens=${effectiveTokenLimit} words=${effectiveDepthRule.maxWords} sentences=${effectiveDepthRule.maxSentences}`);
        }
        if (retrievalPlan.diversityApplied) {
            console.log(`│ Diversity: applied=true (excluded ${retrievalPlan.previousArticlesExcluded} articles)`);
        }
        console.log(`└────────────────────────────────────────┘`);

        const chatResponse: ChatResponse = {
            answer: {
                ...answer,
                foundation,
                certainty: context.retrievedArticles.length > 0
                    ? `Basado en ${context.retrievedArticles.length} artículo(s)`
                    : answer.certainty || "Referencia normativa",
                disclaimer: answer.disclaimer || "Esta respuesta se basa en análisis automatizado de artículos fiscales. No sustituye asesoría fiscal profesional."
            },
            sources,
            titleSuggestion,
            queryAnalysis,
            _debug: debugMeta
        };

        return NextResponse.json(chatResponse);
    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Error procesando la consulta fiscal" }, { status: 500 });
    }
}
