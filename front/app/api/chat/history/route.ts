import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserConversations, getConversationMessages } from "@/lib/chat-storage";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role === "guest") {
            return NextResponse.json({ conversations: [] });
        }

        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        if (conversationId) {
            const messages = await getConversationMessages(conversationId);
            return NextResponse.json({ messages });
        }

        const conversations = await getUserConversations(session.id);
        return NextResponse.json({ conversations });
    } catch (error: any) {
        console.error("[CHAT HISTORY] Error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
