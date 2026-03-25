import { NextResponse } from "next/server";
import { getSession, updateSessionData } from "@/lib/session";
import { getUserConversations, getConversationMessages } from "@/lib/chat-storage";
import { isUuid } from "@/lib/utils";
import { getUserByEmail, createUser } from "@/lib/user-storage";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role === "guest") {
            return NextResponse.json({ conversations: [] });
        }

        // UUID Resolution Patch (Auto-migrate legacy or missing user records)
        if (!isUuid(session.id)) {
            try {
                let dbUser = await getUserByEmail(session.email);
                if (!dbUser) {
                    dbUser = await createUser({
                        email: session.email,
                        name: session.name || "Usuario Migrado",
                        passwordHash: "google-social-migrated",
                        avatarUrl: session.avatarUrl || "",
                        googleAvatarUrl: session.googleAvatarUrl || null,
                        role: "user",
                        professionalProfile: session.professionalProfile || null,
                    });
                }
                if (dbUser) {
                    session.id = dbUser.id; // Update for current request
                    await updateSessionData({ id: dbUser.id }); // Migrate session cookie
                }
            } catch (err) {
                console.error("[HISTORY UUID PATCH] Failed migration:", err);
            }
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
        console.error("[CHAT HISTORY GET] Error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role === "guest") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return NextResponse.json({ error: "ID de conversación faltante" }, { status: 400 });
        }

        // Security check: Verify the conversation belongs to the user
        const conversations = await getUserConversations(session.id);
        const exists = conversations.some(c => c.id === conversationId);
        
        if (!exists) {
            return NextResponse.json({ error: "Conversación no encontrada o no pertenece al usuario" }, { status: 404 });
        }

        const { deleteConversation } = await import("@/lib/chat-storage");
        await deleteConversation(conversationId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[CHAT HISTORY DELETE] Error:", error.message);
        return NextResponse.json({ error: "Error eliminando historial" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role === "guest") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { conversationId, archived } = body;

        if (!conversationId || archived === undefined) {
            return NextResponse.json({ error: "Parámetros faltantes" }, { status: 400 });
        }

        // Security check: Verify the conversation belongs to the user
        const conversations = await getUserConversations(session.id);
        const exists = conversations.some(c => c.id === conversationId);
        
        if (!exists) {
            return NextResponse.json({ error: "Conversación no encontrada o no pertenece al usuario" }, { status: 404 });
        }

        const { archiveConversation } = await import("@/lib/chat-storage");
        await archiveConversation(conversationId, archived);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[CHAT HISTORY PATCH] Error:", error.message);
        return NextResponse.json({ error: "Error actualizando historial" }, { status: 500 });
    }
}
