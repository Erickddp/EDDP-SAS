import { ChatRequest, ChatResponse, StructuredAnswer, SourceReference } from "./types";
import { MOCK_KNOWLEDGE, DEFAULT_ANSWER } from "./mock-knowledge";

export class MockEngine {
    static async processChat(request: ChatRequest, topic?: string): Promise<ChatResponse> {
        const { message, mode, detailLevel } = request;
        const lowerMessage = message.toLowerCase();

        // Find a matching knowledge item by topic OR keywords
        const match = MOCK_KNOWLEDGE.find(item =>
            (topic && item.theme.toLowerCase() === topic.toLowerCase()) ||
            item.keywords.some(keyword => lowerMessage.includes(keyword))
        );

        let answer: StructuredAnswer;
        let sources: SourceReference[];
        let titleSuggestion: string | undefined;

        if (match) {
            const effectiveMode = mode || "casual";
            const effectiveDetail = detailLevel || "detallada";
            const modeAnswers = match.answers[effectiveMode] || match.answers["casual"];
            answer = { ...(modeAnswers[effectiveDetail] || modeAnswers["detallada"]) };
            sources = [...match.sources];
            titleSuggestion = match.theme;
        } else {
            answer = { ...DEFAULT_ANSWER };
            sources = [];
            titleSuggestion = "Consulta general";
        }

        // Synthesize Phase 7B fields if missing
        if (!answer.primaryBasis && (sources.length > 0 || answer.foundation?.[0])) {
            const firstSource = sources[0];
            const firstFoundation = Array.isArray(answer.foundation) ? answer.foundation[0] : null;
            
            answer.primaryBasis = {
                ref: firstSource?.articleRef || (typeof firstFoundation === 'string' ? firstFoundation : "Art. principal"),
                law: firstSource?.title || "Ley General",
                articleNumber: firstSource?.articleRef?.match(/\d+/)?.[0] || "1",
                whySelected: "Base jurídica fundamental detectada para la consulta."
            };
        }
        
        if (!answer.supportingBasis) {
            answer.supportingBasis = (sources.length > 1) 
                ? sources.slice(1).map(s => ({ ref: s.articleRef || s.title, role: "correlation" }))
                : [];
        }

        // Add a slight delay to simulate "thinking" to improve UI feel
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

        return {
            answer,
            sources,
            titleSuggestion
        };
    }

    static generateTitle(message: string): string {
        const lower = message.toLowerCase();
        if (lower.includes("resico")) return "Consulta RESICO";
        if (lower.includes("iva")) return "IVA y Facturación";
        if (lower.includes("multa") || lower.includes("omision")) return "Declaraciones y Multas";
        if (lower.includes("deducciones")) return "Gastos y Deducciones";
        if (lower.includes("obligaciones")) return "Obligaciones Fiscales";

        // Default: Truncate message
        return message.length > 25 ? message.substring(0, 22) + "..." : message;
    }
}
