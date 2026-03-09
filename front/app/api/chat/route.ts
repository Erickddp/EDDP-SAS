import { NextResponse } from "next/server";
import { MockEngine } from "@/lib/mock-engine";
import { ChatRequest, ChatResponse } from "@/lib/types";

export async function POST(req: Request) {
    try {
        const body: ChatRequest = await req.json();

        if (!body.message || !body.conversationId) {
            return NextResponse.json({ error: "Mensaje u ID de conversación faltante" }, { status: 400 });
        }

        const { answer, sources, titleSuggestion } = await MockEngine.processChat(body);

        const response: ChatResponse = {
            answer,
            sources,
            titleSuggestion
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Error procesando la consulta fiscal" }, { status: 500 });
    }
}
