/**
 * Test Adaptive Retrieval — Validates Step 1-5 of Phase 4D.
 * 
 * Tests:
 * - Dynamic limits based on detailLevel
 * - Follow-up limit = 1
 * - Diversity filtering logic
 * 
 * Usage: npm run test:retrieval
 */

import "./load-env";
import { computeArticleLimit, buildRetrievalPlan } from "../lib/retrieval-optimizer";
import { QueryAnalysis } from "../lib/types";
import { ConversationContext } from "../lib/conversation-context";

async function runRetrievalTests() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║   ADAPTIVE RETRIEVAL TEST — Phase 4D Validation        ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, message: string) {
        if (condition) {
            console.log(`  ✅ ${message}`);
            passed++;
        } else {
            console.log(`  ❌ ${message}`);
            failed++;
        }
    }

    // ─── PART 1: Dynamic Limits ──────────────────────────────────────────
    console.log("═══ PART 1: Dynamic Article Limits ═══");
    
    // Follow-up
    assert(computeArticleLimit("detailed", true, 4) === 1, "Follow-up always pulls 1 article");
    
    // Simple
    const simpleLimit = computeArticleLimit("simple", false, 2);
    assert(simpleLimit === 2, `Simple detail pull 2 articles (got ${simpleLimit})`);
    
    // Detailed
    const detailedLimit = computeArticleLimit("detailed", false, 4);
    assert(detailedLimit === 4, `Detailed detail pull 4 articles (got ${detailedLimit})`);
    
    // Technical
    const technicalLimit = computeArticleLimit("technical", false, 7);
    assert(technicalLimit === 7, `Technical detail pull up to 7 articles (got ${technicalLimit})`);

    // ─── PART 2: Diversity Filter Logic ──────────────────────────────────
    console.log("\n═══ PART 2: Diversity Filtering Logic ═══");
    
    const mockAnalysis: QueryAnalysis = {
        complexity: "normal",
        mode: "professional",
        detail: "detailed",
        retrievalDepth: 4,
        tokenLimit: 350,
        detectedIntent: "general"
    } as any;

    const mockCtx: ConversationContext = {
        lastTopic: "isnter",
        lastIntent: "general",
        lastSources: ["CFF Art 1"],
        lastLaw: "CFF",
        lastArticleIds: ["article-123", "article-456"],
        lastQuery: "hola",
        updatedAt: Date.now()
    };

    // Diversity should apply for new independent question
    const planNew = buildRetrievalPlan(mockAnalysis, false, false, 4, mockCtx);
    assert(planNew.diversityApplied === true, "Diversity applied for new question");
    assert(planNew.excludeArticleIds.length === 2, "2 articles excluded for diversity");
    assert(planNew.excludeArticleIds.includes("article-123"), "Diversity excludes article-123");

    // Diversity should be SKIPPED for follow-up
    const planFollowUp = buildRetrievalPlan(mockAnalysis, true, false, 4, mockCtx);
    assert(planFollowUp.diversityApplied === false, "Diversity skipped for follow-up");
    assert(planFollowUp.excludeArticleIds.length === 0, "No articles excluded for follow-up");

    // Diversity should be SKIPPED for exact match
    const planExact = buildRetrievalPlan(mockAnalysis, false, true, 4, mockCtx);
    assert(planExact.diversityApplied === false, "Diversity skipped for exact reference");

    // ─── PART 3: Law Priority ───────────────────────────────────────────
    console.log("\n═══ PART 3: Law Context Priority ═══");
    assert(planFollowUp.preferredLaw === "CFF", "Follow-up prioritizes last law (CFF)");
    assert(planNew.preferredLaw === null, "Independent question has no law priority from context");

    // ─── Summary ─────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(60));
    console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("═".repeat(60));

    process.exit(failed > 0 ? 1 : 0);
}

runRetrievalTests();
