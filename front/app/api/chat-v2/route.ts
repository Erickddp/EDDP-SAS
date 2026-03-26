import { NextResponse } from "next/server";

export const maxDuration = 60; // Vercel: allow up to 60s for Orchestrator streaming
import { ChatRequest, StructuredAnswer } from "@/lib/types";
import { buildLegalContext } from "@/lib/context-builder";
import { openaiModel, OPENAI_MODEL } from "@/lib/openai";
import { parseLegalReference } from "@/lib/law-alias";
import { analyzeQueryWithDebug } from "@/lib/query-analyzer";
import { getSession, updateSessionData } from "@/lib/session";
import { buildRetrievalPlan } from "@/lib/retrieval-optimizer";
import { PlanType, GUEST_LIMIT, PLAN_LIMITS } from "@/lib/saas-constants";
import { streamText, tool } from "ai";
import { z } from "zod";
import { isUuid } from "@/lib/utils";
import { CONFIG } from "@/lib/env-config";
import { getSubscriptionByUserId, getUserById, getUserByEmail, createUser, getUserPreferences } from "@/lib/user-storage";
import { checkUsageLimit, incrementUsage } from "@/lib/usage-enforcer";
import { logUsage } from "@/lib/observability";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";
import { saveConversation, saveMessage as saveChatMsg } from "@/lib/chat-storage";
import { isRateLimited } from "@/lib/cache-manager";
import { detectFollowUp, getConversationContext, updateConversationContext } from "@/lib/conversation-context";
import { getCachedResponse } from "@/lib/cache-manager";

export async function POST(req: Request) {
    const methodError = validatedMethod(req, ["POST"]);
    if (methodError) return methodError;

    const startTime = Date.now();
    const clientIp = req.headers.get("x-forwarded-for") || "local";
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

        // Edge Rate Limiting
        const isLimited = await isRateLimited(clientIp, 5, 60);
        if (isLimited) {
            return NextResponse.json({ 
                error: "Demasiadas peticiones", 
                message: "Has superado el límite de 5 consultas por minuto." 
            }, { status: 429 });
        }

        // --- Auth & Paywall Logic from v1 (Aislamiento Arquitectónico) ---
        isGuest = !session || session.role === "guest";
        userId = isGuest ? ("anonymous-guest-" + clientIp) : (session?.id || "unknown");
        
        if (!isGuest && session?.id) {
            const subscription = await getSubscriptionByUserId(session.id);
            const now = new Date();
            const isPeriodValid = !subscription?.current_period_end || new Date(subscription.current_period_end) > now;
            const isStatusValid = subscription?.status === 'active' || subscription?.status === 'trialing';
            plan = (isStatusValid && isPeriodValid) ? (subscription?.plan_type || "gratis") : "gratis";
        }

        const { allowed, remaining, total } = await checkUsageLimit(userId, plan as PlanType, isGuest);
        
        if (!allowed) {
            if (plan === "pro" || plan === "despacho") {
                return NextResponse.json({ 
                    error: "Límite de capacidad alcanzado", 
                    code: "RATE_LIMIT_EXCEEDED"
                }, { status: 429 });
            }
            return NextResponse.json({ 
                error: "Límite alcanzado", 
                code: isGuest ? "GUEST_LIMIT_REACHED" : "USAGE_LIMIT_EXCEEDED",
                total, remaining
            }, { status: 402 });
        }

        // UUID Resolution Patch
        if (session && !isGuest && !isUuid(session.id)) {
            try {
                let dbUser = await getUserByEmail(session.email);
                if (!dbUser) {
                    dbUser = await createUser({
                        email: session.email, name: session.name || "Usuario Migrado", passwordHash: "migrated", avatarUrl: "", role: "user"
                    });
                }
                if (dbUser) {
                    userId = dbUser.id;
                    await updateSessionData({ id: dbUser.id });
                }
            } catch (err) {}
        }

        let userContext: any = undefined;
        if (session) {
            const preferences = await getUserPreferences(session.id);
            userContext = { ...session, ...preferences };
        }

        // Memory
        const previousContext = getConversationContext(body.conversationId);
        const followUpResult = detectFollowUp(body.message, previousContext);
        let effectiveQuery = body.message;
        if (followUpResult.isFollowUp && previousContext) {
            effectiveQuery = `${previousContext.lastQuery} | Seguimiento: ${body.message}`;
        }

        // Cache Support (Semantic Check)
        const userProfile = userContext?.professionalProfile || "entrepreneur";
        const cached = await getCachedResponse(body.message, userProfile);
        if (cached && !followUpResult.isFollowUp) {
            return NextResponse.json({
                ...cached,
                _debug: { cacheHit: true, totalTimeMs: Date.now() - startTime }
            });
        }

        if (!CONFIG.OPENAI_API_KEY) {
            return handleApiError(new Error("API Key faltante"), AppErrorType.OPENAI);
        }

        let globalSources: any[] = [];
        let globalTags: string[] = ["General V2"];
        let toolTokens = 0;

        // The Orchestrator core
        const result = streamText({
            model: openaiModel(OPENAI_MODEL),
            messages: [
                {
                    role: "system", 
                    content: `Eres un estratega fiscal. Perfil del usuario: ${userProfile}.

REGLAS DE ORQUESTACIÓN ESTRICTA:
1. Si el usuario saluda o hace preguntas no legales, responde de manera cortés y directa SIN usar herramientas de búsqueda.
2. Usa la herramienta 'Busqueda_Fiscal_Profunda' ÚNICAMENTE si la consulta requiere análisis normativo, cálculo de impuestos o defensa legal.
3. TU RESPUESTA FINAL SIEMPRE DEBE SER UN OBJETO JSON VÁLIDO QUE CUMPLA CON LA ESTRUCTURA 'StructuredAnswer' (incluyendo summary, foundation, scenarios, etc.). No devuelvas texto plano, incluso para saludos.

Ejemplo simple de saludo:
{"summary": "Hola, soy MyFiscal. ¿En qué te puedo ayudar hoy con tus temas fiscales?", "foundation": [], "scenarios": [], "consequences": [], "certainty": "Sistema", "disclaimer": ""}
`
                },
                ...((body.history || []).map((m: any) => ({ role: m.role, content: m.content }))),
                {
                    role: "user",
                    content: effectiveQuery
                }
            ],
            tools: {
                Busqueda_Fiscal_Profunda: tool({
                    description: 'Realiza una búsqueda profunda en la base de datos de jurisprudencia y leyes de MyFiscal para resolver dudas fiscales, contables, cálculos o deducciones.',
                    parameters: z.object({
                        query: z.string().describe('Consulta legal re-formulada para buscar en MyFiscal.'),
                    }),
                    // @ts-ignore
                    execute: async (args: any) => {
                        const query = args.query;
                        console.log("🛠️ [AGENT TOOL V2] Busqueda_Fiscal_Profunda ejecutándose para ->", query);
                        const parsedRef = parseLegalReference(query);
                        const { analysis } = analyzeQueryWithDebug(query, body.mode, body.detailLevel);
                        const rPlan = buildRetrievalPlan(analysis, followUpResult.isFollowUp, false, 5, previousContext);
                        
                        const context = await buildLegalContext(
                            query,
                            parsedRef,
                            rPlan.effectiveArticleLimit,
                            [],
                            rPlan.preferredLaw
                        );
                        
                        globalSources = context.retrievedArticles.map(art => ({
                            id: art.id,
                            title: `${art.documentAbbreviation} Art. ${art.articleNumber}`,
                            type: "Articulo",
                            status: "Vigente",
                            articleRef: `${art.documentAbbreviation} ${art.articleNumber}`,
                            text: art.text,
                            fragments: []
                        }));
                        
                        toolTokens += 500; // Est. RAG overhead

                        return {
                            articulos_encontrados: context.retrievedArticles.map(art => ({
                                documento: art.documentAbbreviation,
                                articulo: art.articleNumber,
                                texto_relevante: art.text.substring(0, 1500)
                            }))
                        };
                    }
                })
            },
            // @ts-ignore: maxSteps might not be in the type definition but works at runtime
            maxSteps: 3,
            onFinish: async (completion) => {
                try {
                    const finishTime = Date.now();
                    const duration = finishTime - startTime;

                    if (!isGuest) await incrementUsage(userId);
                    
                    await logUsage({
                        userId, conversationId: body.conversationId, 
                        promptTokens: (completion.usage as any).promptTokens + toolTokens,
                        completionTokens: (completion.usage as any).completionTokens,
                        model: OPENAI_MODEL, durationMs: duration, status: "success", ipAddress: clientIp
                    });

                    if (userId !== "unknown") {
                        await saveConversation(userId, {
                            id: body.conversationId, title: "Consulta V2", mode: body.mode, detailLevel: body.detailLevel,
                            archived: false, createdAt: Date.now(), updatedAt: Date.now(), tags: globalTags
                        });
                        
                        await saveChatMsg({ id: `user-${Date.now()}`, conversationId: body.conversationId, role: "user", content: body.message, createdAt: Date.now() });
                        await saveChatMsg({ id: `assistant-${Date.now()}`, conversationId: body.conversationId, role: "assistant", content: completion.text, sources: globalSources, createdAt: Date.now() });
                    }
                } catch (e) {
                    console.error("[V2] Error onFinish", e);
                }
            }
        });

        // Retener formato v1 para compatibility UI y permitir Tool Call Chunks silenciosos
        return result.toTextStreamResponse({ headers: { 'x-vercel-ai-data-stream': 'v1' } });
        
    } catch (error: any) {
        console.error("[OPEANAI V2 FATAL]", error);
        return handleApiError(error, AppErrorType.INTERNAL);
    }
}
