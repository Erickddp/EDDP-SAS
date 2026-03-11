/**
 * Conversation Context — Lightweight session memory for follow-up detection.
 * 
 * Stores the last topic, intent, sources, and law per conversationId.
 * In-memory Map (no external DB required). Auto-expires after 30 min.
 */

import { LegalIntent } from "./intent-templates";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConversationContext {
    lastTopic: string;
    lastIntent: LegalIntent;
    lastSources: string[];       // e.g. ["LISR Art. 113-I", "CFF Art. 82"]
    lastLaw: string;             // e.g. "LISR"
    lastArticleIds: string[];    // IDs of articles used in last turn
    lastQuery: string;           // original user message
    updatedAt: number;           // Date.now()
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

const contextStore = new Map<string, ConversationContext>();

const TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get stored context for a conversation, or null if expired/missing.
 */
export function getConversationContext(conversationId: string): ConversationContext | null {
    const ctx = contextStore.get(conversationId);
    if (!ctx) return null;

    // Expire after TTL
    if (Date.now() - ctx.updatedAt > TTL_MS) {
        contextStore.delete(conversationId);
        return null;
    }

    return ctx;
}

/**
 * Update context after a successful response.
 */
export function updateConversationContext(
    conversationId: string,
    topic: string,
    intent: LegalIntent,
    sources: string[],
    articleIds: string[],
    law: string,
    query: string
): void {
    contextStore.set(conversationId, {
        lastTopic: topic,
        lastIntent: intent,
        lastSources: sources.slice(0, 5), // keep max 5
        lastArticleIds: articleIds,
        lastLaw: law,
        lastQuery: query,
        updatedAt: Date.now()
    });

    console.log(`[ConversationMemory] Stored context for ${conversationId.slice(0, 8)}...`);
    console.log(`  Topic: ${topic} | Intent: ${intent} | Law: ${law} | Sources: ${sources.length}`);
}

// ─── Follow-Up Detection ────────────────────────────────────────────────────

const FOLLOW_UP_STARTERS = [
    "y ", "¿y ", "¿y ", "y si ", "¿y si ",
    "pero ", "¿pero ", "entonces ", "¿entonces ",
    "de cuánto", "de cuanto", "cuánto es", "cuanto es",
    "cuál es", "cual es", "cómo se", "como se"
];

const FOLLOW_UP_PRONOUNS = [
    "eso", "esa", "ese", "esto", "esta", "este",
    "lo mismo", "la misma", "el mismo", "lo anterior"
];

/**
 * Detects if a message is a follow-up to a previous conversation.
 * Uses heuristics: short messages, pronoun references, lack of new legal entities.
 */
export function detectFollowUp(
    message: string,
    previousContext: ConversationContext | null
): { isFollowUp: boolean; reason: string } {
    // No previous context = can't be a follow-up
    if (!previousContext) {
        return { isFollowUp: false, reason: "no_previous_context" };
    }

    const msg = message.toLowerCase().trim();
    const words = msg.split(/\s+/);

    // 1. Very short message (< 7 words)
    const isShort = words.length < 7;

    // 2. Starts with follow-up pattern (only for short-ish messages)
    const hasFollowUpStarter = words.length <= 10 && FOLLOW_UP_STARTERS.some(s => msg.startsWith(s));

    // 3. Contains reference pronouns (whole-word match to avoid false positives like "establece")
    const hasPronouns = FOLLOW_UP_PRONOUNS.some(p => {
        const re = new RegExp(`\\b${p}\\b`, "i");
        return re.test(msg);
    });

    // 4. Lacks a new legal entity (no specific law/article reference)
    const legalEntities = ["artículo", "articulo", "art ", "art.", "ley ", "código", "codigo", "lisr", "liva", "cff", "lieps"];
    const hasNewLegalEntity = legalEntities.some(e => msg.includes(e));

    // 5. Doesn't ask a completely new topic (no long descriptive question)
    const isLongNewQuestion = words.length > 15 && !hasPronouns && !hasFollowUpStarter;

    // ─── Decision ───────────────────────────────────────────────────────
    if (isLongNewQuestion) {
        return { isFollowUp: false, reason: "long_new_question" };
    }

    if (hasNewLegalEntity && words.length > 10) {
        return { isFollowUp: false, reason: "new_legal_entity_in_long_query" };
    }

    if (isShort && !hasNewLegalEntity) {
        return { isFollowUp: true, reason: "short_no_legal_entity" };
    }

    if (hasFollowUpStarter) {
        return { isFollowUp: true, reason: "follow_up_starter" };
    }

    if (hasPronouns) {
        return { isFollowUp: true, reason: "pronoun_reference" };
    }

    // Short with question words about the same domain
    if (isShort) {
        return { isFollowUp: true, reason: "short_message" };
    }

    return { isFollowUp: false, reason: "independent_query" };
}
