/**
 * Retrieval Optimizer — Adaptive article retrieval based on detail level,
 * follow-up status, and conversation history.
 * 
 * Controls:
 * - Dynamic article limits per detail level
 * - Article diversity filter (avoid repeating previous articles)
 * - Law context priority for follow-ups
 */

import { QueryAnalysis } from "./types";
import { ConversationContext } from "./conversation-context";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RetrievalPlan {
    /** Effective article limit after all adjustments */
    effectiveArticleLimit: number;
    /** Article IDs to exclude for diversity (unless follow-up or exact ref) */
    excludeArticleIds: string[];
    /** Whether diversity filter was applied */
    diversityApplied: boolean;
    /** Number of excluded previous articles */
    previousArticlesExcluded: number;
    /** Effective retrieval strategy label */
    strategyLabel: string;
    /** Preferred law for priority boosting */
    preferredLaw: string | null;
}

// ─── Article Limit Rules ────────────────────────────────────────────────────

export interface ArticleLimitRule {
    min: number;
    max: number;
    label: string;
}

export const ARTICLE_LIMIT_RULES: Record<string, ArticleLimitRule> = {
    followUp: { min: 1, max: 1, label: "follow-up (1 article)" },
    simple: { min: 1, max: 2, label: "simple (1–2 articles)" },
    detailed: { min: 3, max: 4, label: "detailed (3–4 articles)" },
    technical: { min: 5, max: 7, label: "technical (5–7 articles)" }
};

/**
 * Computes the effective article limit based on detail level and follow-up status.
 */
export function computeArticleLimit(
    detail: QueryAnalysis["detail"],
    isFollowUp: boolean,
    tierMaxArticles: number
): number {
    if (isFollowUp) {
        return ARTICLE_LIMIT_RULES.followUp.max; // always 1
    }

    switch (detail) {
        case "simple":
            return Math.min(ARTICLE_LIMIT_RULES.simple.max, tierMaxArticles);
        case "detailed":
            return Math.min(ARTICLE_LIMIT_RULES.detailed.max, tierMaxArticles);
        case "technical":
            return Math.min(ARTICLE_LIMIT_RULES.technical.max, tierMaxArticles);
        default:
            return Math.min(4, tierMaxArticles);
    }
}

/**
 * Returns the applicable rule label for logging/debug.
 */
export function getArticleLimitLabel(detail: QueryAnalysis["detail"], isFollowUp: boolean): string {
    if (isFollowUp) return ARTICLE_LIMIT_RULES.followUp.label;
    return ARTICLE_LIMIT_RULES[detail]?.label || "default";
}

// ─── Diversity Filter ───────────────────────────────────────────────────────

/**
 * Computes which article IDs should be excluded to ensure diversity.
 * 
 * Exclusion is SKIPPED when:
 * - isFollowUp is true (follow-ups should reuse previous context)
 * - hasExactRef is true (user asked for a specific article)
 */
export function computeDiversityExclusions(
    previousContext: ConversationContext | null,
    isFollowUp: boolean,
    hasExactRef: boolean
): { excludeIds: string[]; applied: boolean } {
    // Skip diversity for follow-ups and exact references
    if (isFollowUp || hasExactRef) {
        return { excludeIds: [], applied: false };
    }

    if (!previousContext || !previousContext.lastArticleIds || previousContext.lastArticleIds.length === 0) {
        return { excludeIds: [], applied: false };
    }

    return {
        excludeIds: [...previousContext.lastArticleIds],
        applied: true
    };
}

// ─── Full Retrieval Plan ────────────────────────────────────────────────────

/**
 * Builds a complete retrieval plan combining all optimization factors.
 */
export function buildRetrievalPlan(
    queryAnalysis: QueryAnalysis,
    isFollowUp: boolean,
    hasExactRef: boolean,
    tierMaxArticles: number,
    previousContext: ConversationContext | null
): RetrievalPlan {
    const effectiveArticleLimit = computeArticleLimit(
        queryAnalysis.detail,
        isFollowUp,
        tierMaxArticles
    );

    const diversity = computeDiversityExclusions(previousContext, isFollowUp, hasExactRef);

    // Preferred law: from previous context for follow-ups, or null
    const preferredLaw = (isFollowUp && previousContext)
        ? previousContext.lastLaw
        : null;

    // Strategy label
    let strategyLabel = "standard";
    if (isFollowUp) {
        strategyLabel = "context-aware";
    } else if (hasExactRef) {
        strategyLabel = "exact-match";
    } else if (diversity.applied) {
        strategyLabel = "diversity-filtered";
    }

    return {
        effectiveArticleLimit,
        excludeArticleIds: diversity.excludeIds,
        diversityApplied: diversity.applied,
        previousArticlesExcluded: diversity.excludeIds.length,
        strategyLabel,
        preferredLaw
    };
}
