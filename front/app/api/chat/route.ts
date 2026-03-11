import { NextResponse } from "next/server";
import { MockEngine } from "@/lib/mock-engine";
import { ChatRequest, ChatResponse, StructuredAnswer } from "@/lib/types";
import { tokenizeQuery } from "@/lib/legal-search";
import { buildLegalContext } from "@/lib/context-builder";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/llm-prompt";
import { parseLegalReference } from "@/lib/law-alias";

export async function POST(req: Request) {
    try {
        const body: ChatRequest = await req.json();

        if (!body.message || !body.conversationId) {
            return NextResponse.json({ error: "Mensaje u ID de conversación faltante" }, { status: 400 });
        }

        // 0. Procesar memoria de conversación (Contexto reciente)
        const history = body.history || [];
        let effectiveQuery = body.message;

        if (history.length > 0) {
            const lastUserMessage = [...history].reverse().find(m => m.role === "user")?.content;
            const msg = body.message.toLowerCase().trim();

            // Detectar si es una pregunta de seguimiento
            const isFollowUp = msg.startsWith("y ") || 
                               msg.startsWith("¿y ") || 
                               msg.length < 20 ||
                               msg.includes("eso") || 
                               msg.includes("esta") || 
                               msg.includes("este");

            if (isFollowUp && lastUserMessage) {
                effectiveQuery = `${lastUserMessage} | Seguimiento: ${body.message}`;
            }
        }

        // 0.5. Extraer intención determinista de artículos / leyes 
        const parsedRef = parseLegalReference(effectiveQuery);

        // 1. Obtener contexto legal enriquecido (RAG Híbrido Local o Base de Datos)
        const context = await buildLegalContext(effectiveQuery, parsedRef, 3);

        // 2. Generar respuesta (OpenAI con fallback a MockEngine)
        let answer: StructuredAnswer;
        let mockResult = null;

        // Determinar estrategia exacta
        const hasExactMatch = !!parsedRef.lawAbbreviation && !!parsedRef.articleNumber && context.retrievedArticles.length > 0;
        const retrievalStrategy = hasExactMatch ? 'exact-law-article' : context.retrievalMeta.strategy;

        console.log(`[Observability] Estrategia: ${retrievalStrategy} | ExactMatch: ${hasExactMatch ? 'Sí' : 'No'} | Fallback: ${context.retrievalMeta.strategy}`);

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
                            retrievalStrategy,
                            parsedRef
                        }) },
                        { role: "user", content: buildUserPrompt({ 
                            message: body.message, 
                            mode: body.mode, 
                            detailLevel: body.detailLevel, 
                            topic: context.topic, 
                            legalContext: context.retrievedArticles,
                            history: body.history,
                            retrievalStrategy,
                            parsedRef
                        }) }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.2
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

        // 3. Integrar artículos en la respuesta estructurada
        const foundation = answer.foundation.length > 0 ? answer.foundation : (mockResult?.answer.foundation || context.foundation);
        const sources = context.sources.length > 0 ? context.sources : (mockResult?.sources || []);

        // 4. Sugerencia de título
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
            titleSuggestion
        };

        return NextResponse.json(chatResponse);
    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Error procesando la consulta fiscal" }, { status: 500 });
    }
}
