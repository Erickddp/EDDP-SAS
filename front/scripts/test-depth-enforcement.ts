/**
 * Test Depth Enforcement — Validates that DEPTH_RULES are correctly configured
 * and that the prompt builder injects proper enforcement instructions.
 * 
 * Usage: npm run test:depth
 */

import "./load-env";
import { DEPTH_RULES, getDepthRules, buildSystemPrompt } from "../lib/llm-prompt";
import { QueryAnalysis } from "../lib/types";

interface DepthTestCase {
    id: number;
    detail: QueryAnalysis["detail"];
    description: string;
    expectedMinWords: number;
    expectedMaxWords: number;
    expectedRequired: string[];
    expectedForbidden: string[];
    maxSentences?: number;
}

const DEPTH_TEST_CASES: DepthTestCase[] = [
    {
        id: 1,
        detail: "simple",
        description: "Simple → short response (15-80 words, max 3 sentences)",
        expectedMinWords: 15,
        expectedMaxWords: 80,
        expectedRequired: ["summary", "foundation"],
        expectedForbidden: ["relatedArticles", "legalInterpretation"],
        maxSentences: 3
    },
    {
        id: 2,
        detail: "detailed",
        description: "Detailed → medium response (120-300 words, all core sections)",
        expectedMinWords: 120,
        expectedMaxWords: 300,
        expectedRequired: ["summary", "foundation", "scenarios", "consequences"],
        expectedForbidden: []
    },
    {
        id: 3,
        detail: "technical",
        description: "Technical → long response (300-700 words, full analysis)",
        expectedMinWords: 301,
        expectedMaxWords: 700,
        expectedRequired: ["summary", "foundation", "relatedArticles", "legalInterpretation", "scenarios", "consequences"],
        expectedForbidden: []
    }
];

// Simulate prompt generation and check enforcement injection
interface PromptTestCase {
    id: number;
    detail: QueryAnalysis["detail"];
    complexity: QueryAnalysis["complexity"];
    description: string;
    checkStrings: string[];  // strings that must appear in the generated prompt
}

const PROMPT_TEST_CASES: PromptTestCase[] = [
    {
        id: 4,
        detail: "simple",
        complexity: "simple",
        description: "Simple prompt must contain word limit and forbidden sections",
        checkStrings: ["15", "80", "MÁXIMO 3 oraciones", "PROHIBIDAS"]
    },
    {
        id: 5,
        detail: "detailed",
        complexity: "normal",
        description: "Detailed prompt must contain word range and required sections",
        checkStrings: ["120", "300", "scenarios", "consequences", "OBLIGATORIAS"]
    },
    {
        id: 6,
        detail: "technical",
        complexity: "complex",
        description: "Technical prompt must contain large word range and full sections",
        checkStrings: ["301", "700", "relatedArticles", "legalInterpretation", "Todas las secciones"]
    }
];

async function runDepthTests() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║      DEPTH ENFORCEMENT TEST — Phase 4B Validation       ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    let passed = 0;
    let failed = 0;
    const results: { id: number; description: string; status: string; details: string }[] = [];

    // ─── Part 1: Depth Rules Configuration Tests ────────────────────────
    console.log("═══ PART 1: Depth Rules Configuration ═══\n");

    for (const tc of DEPTH_TEST_CASES) {
        console.log(`${"─".repeat(60)}`);
        console.log(`TEST #${tc.id}: ${tc.description}`);
        console.log(`${"─".repeat(60)}`);

        const rule = getDepthRules(tc.detail);
        const errors: string[] = [];

        if (rule.minWords !== tc.expectedMinWords) {
            errors.push(`minWords: expected=${tc.expectedMinWords} got=${rule.minWords}`);
        }
        if (rule.maxWords !== tc.expectedMaxWords) {
            errors.push(`maxWords: expected=${tc.expectedMaxWords} got=${rule.maxWords}`);
        }
        if (tc.maxSentences && rule.maxSentences !== tc.maxSentences) {
            errors.push(`maxSentences: expected=${tc.maxSentences} got=${rule.maxSentences}`);
        }

        // Check required sections
        for (const sec of tc.expectedRequired) {
            if (!rule.requiredSections.includes(sec)) {
                errors.push(`Missing required section: ${sec}`);
            }
        }

        // Check forbidden sections
        for (const sec of tc.expectedForbidden) {
            if (!rule.forbiddenSections.includes(sec)) {
                errors.push(`Missing forbidden section: ${sec}`);
            }
        }

        const status = errors.length === 0 ? "PASS ✅" : "FAIL ❌";
        if (errors.length === 0) passed++; else failed++;

        console.log(`  Result: ${status}`);
        console.log(`  Rule: ${rule.label}`);
        console.log(`  Words: ${rule.minWords}-${rule.maxWords}${rule.maxSentences ? ` (max ${rule.maxSentences} sentences)` : ""}`);
        console.log(`  Required: [${rule.requiredSections.join(", ")}]`);
        console.log(`  Forbidden: [${rule.forbiddenSections.join(", ")}]`);
        if (errors.length > 0) errors.forEach(e => console.log(`    ⚠ ${e}`));

        results.push({ id: tc.id, description: tc.description, status, details: errors.join("; ") || "OK" });
    }

    // ─── Part 2: Prompt Injection Tests ──────────────────────────────────
    console.log("\n\n═══ PART 2: Prompt Injection Verification ═══\n");

    for (const tc of PROMPT_TEST_CASES) {
        console.log(`${"─".repeat(60)}`);
        console.log(`TEST #${tc.id}: ${tc.description}`);
        console.log(`${"─".repeat(60)}`);

        const mockAnalysis: QueryAnalysis = {
            complexity: tc.complexity,
            mode: "professional",
            detail: tc.detail,
            retrievalDepth: 4,
            tokenLimit: 350,
            detectedIntent: "general"
        };

        const prompt = buildSystemPrompt({
            message: "prueba de profundidad",
            mode: "profesional",
            detailLevel: tc.detail === "simple" ? "sencilla" : tc.detail === "detailed" ? "detallada" : "tecnica",
            topic: "test",
            legalContext: [],
            queryAnalysis: mockAnalysis
        });

        const errors: string[] = [];

        for (const checkStr of tc.checkStrings) {
            if (!prompt.includes(checkStr)) {
                errors.push(`Missing in prompt: "${checkStr}"`);
            }
        }

        // Must always contain "REGLAS DE PROFUNDIDAD"
        if (!prompt.includes("REGLAS DE PROFUNDIDAD")) {
            errors.push("Missing depth rules header");
        }

        const status = errors.length === 0 ? "PASS ✅" : "FAIL ❌";
        if (errors.length === 0) passed++; else failed++;

        console.log(`  Result: ${status}`);
        console.log(`  Prompt length: ${prompt.length} chars`);
        console.log(`  Contains depth rules: ${prompt.includes("REGLAS DE PROFUNDIDAD") ? "✓" : "✗"}`);
        if (errors.length > 0) errors.forEach(e => console.log(`    ⚠ ${e}`));

        results.push({ id: tc.id, description: tc.description, status, details: errors.join("; ") || "OK" });
    }

    // ─── Part 3: Scaling Validation ──────────────────────────────────────
    console.log("\n\n═══ PART 3: Scaling Verification ═══\n");

    const levels: QueryAnalysis["detail"][] = ["simple", "detailed", "technical"];
    let prevMax = 0;
    let scalingOk = true;
    const scalingErrors: string[] = [];

    for (const level of levels) {
        const rule = DEPTH_RULES[level];
        if (rule.minWords <= prevMax && level !== "simple") {
            scalingErrors.push(`${level} minWords (${rule.minWords}) should be > previous maxWords (${prevMax})`);
            scalingOk = false;
        }
        if (rule.maxWords <= rule.minWords) {
            scalingErrors.push(`${level} maxWords (${rule.maxWords}) should be > minWords (${rule.minWords})`);
            scalingOk = false;
        }
        prevMax = rule.maxWords;
    }

    const scalingStatus = scalingOk ? "PASS ✅" : "FAIL ❌";
    if (scalingOk) passed++; else failed++;
    console.log(`TEST #7: Word limits scale correctly (simple < detailed < technical)`);
    console.log(`  Result: ${scalingStatus}`);
    for (const level of levels) {
        const rule = DEPTH_RULES[level];
        console.log(`  ${level}: ${rule.minWords}-${rule.maxWords} words`);
    }
    if (scalingErrors.length > 0) scalingErrors.forEach(e => console.log(`    ⚠ ${e}`));
    results.push({ id: 7, description: "Word limits scale correctly", status: scalingStatus, details: scalingErrors.join("; ") || "OK" });

    // ─── Summary ─────────────────────────────────────────────────────────
    const total = results.length;
    console.log(`\n\n${"═".repeat(60)}`);
    console.log("SUMMARY TABLE");
    console.log(`${"═".repeat(60)}`);
    console.log(`${"#".padEnd(4)} ${"Detail".padEnd(12)} ${"Description".padEnd(38)} ${"Status"}`);
    console.log(`${"─".repeat(60)}`);
    for (const r of results) {
        const detail = r.id <= 3 ? DEPTH_TEST_CASES.find(t => t.id === r.id)?.detail || "" : r.id <= 6 ? PROMPT_TEST_CASES.find(t => t.id === r.id)?.detail || "" : "all";
        console.log(`${String(r.id).padEnd(4)} ${detail.padEnd(12)} ${r.description.substring(0, 38).padEnd(38)} ${r.status}`);
    }
    console.log(`${"─".repeat(60)}`);
    console.log(`PASSED: ${passed}/${total} | FAILED: ${failed}/${total}`);

    if (failed > 0) {
        console.log("\n⚠ FAILURES:");
        results.filter(r => r.status.includes("FAIL")).forEach(r => {
            console.log(`  Test #${r.id}: ${r.details}`);
        });
    }

    console.log(`${"═".repeat(60)}`);
    process.exit(failed > 0 ? 1 : 0);
}

runDepthTests();
