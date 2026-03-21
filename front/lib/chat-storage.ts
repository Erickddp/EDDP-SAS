import { query, getClient } from "./db";
import { Conversation, Message } from "./types";

export async function getUserConversations(userId: string): Promise<Conversation[]> {
    const { rows } = await query(
        `SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC`,
        [userId]
    );
    return rows.map(r => ({
        id: r.id,
        title: r.title,
        mode: r.mode,
        detailLevel: r.detail_level,
        archived: r.archived,
        createdAt: r.created_at.getTime(),
        updatedAt: r.updated_at.getTime()
    }));
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
    const { rows } = await query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversationId]
    );
    return rows.map(r => ({
        id: r.id,
        conversationId: r.conversation_id,
        role: r.role,
        content: r.content,
        sources: r.sources,
        createdAt: r.created_at.getTime()
    }));
}

export async function saveConversation(userId: string, conversation: Conversation): Promise<void> {
    await query(
        `INSERT INTO conversations (id, user_id, title, mode, detail_level, archived, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET 
            title = EXCLUDED.title, 
            mode = EXCLUDED.mode, 
            detail_level = EXCLUDED.detail_level,
            archived = EXCLUDED.archived,
            updated_at = NOW()`,
        [conversation.id, userId, conversation.title, conversation.mode, conversation.detailLevel, conversation.archived || false]
    );
}

export async function saveMessage(message: Message): Promise<void> {
    await query(
        `INSERT INTO messages (id, conversation_id, role, content, sources)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [message.id, message.conversationId, message.role, JSON.stringify(message.content), message.sources ? JSON.stringify(message.sources) : null]
    );
}

export async function deleteConversation(conversationId: string): Promise<void> {
    await query(`DELETE FROM conversations WHERE id = $1`, [conversationId]);
}

export async function archiveConversation(conversationId: string, archived: boolean): Promise<void> {
    await query(
        `UPDATE conversations SET archived = $1, updated_at = NOW() WHERE id = $2`,
        [archived, conversationId]
    );
}
