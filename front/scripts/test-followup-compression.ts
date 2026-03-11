/**
 * Test Follow-Up Compression — Validates that follow-up override rules
 * correctly compress depth, tokens, and section allowances.
 * 
 * Usage: npm run test:followup
 */

import "./load-env";
import { 
    DEPTH_RULES, 
    FOLLOW_UP_DEPTH_OVERRIDE, 
    FOLLOW_UP_TOKEN_MULTIPLIER,
    getEffectiveDepthRule, 
    buildSystemPrompt 
} from "../lib/llm-prompt";
import { RETRIEVAL_CONFIG } from "../lib/retrieval-config";
import { QueryAnalysis } from "../lib/types";
import { detectFollowUp, ConversationContext } from "../lib/conversation-context";

const MOCK_CONTEXT: ConversationContext = {
    lastTopic: "continuacion_voluntaria_imss",
    lastIntent: "general",
    lastSources: ["LSS Art. 12", "LSS Art. 218"],
    lastArticleIds: [],
    lastLaw: "LSS",
    lastQuery: "Si dejo de trabajar puedo seguir en el IMSS",
    updatedAt: Date.now()
};

async function runFollowUpTests() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║   FOLLOW-UP COMPRESSION TEST — Phase 4C Validation      ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    let passed = 0;
    let failed = 0;
    const results: { id: number; description: string; status: string; details: string }[] = [];

    function checkResult(id: number, description: string, errors: string[]) {
        const status = errors.length === 0 ? "PASS ✅" : "FAIL ❌";
        if (errors.length === 0) passed++; else failed++;
        console.log(`  Result: ${status}`);
        if (errors.length > 0) errors.forEach(e => console.log(`    ⚠ ${e}`));
        results.push({ id, description, status, details: errors.join("; ") || "OK" });
    }

    // ─── Test 1: Override rule configuration ─────────────────────────────
    console.log(`${"─".repeat(60)}`);
    console.log(`TEST #1: FOLLOW_UP_DEPTH_OVERRIDE configuration`);
    console.log(`${"─".repeat(60)}`);
    {
        const r = FOLLOW_UP_DEPTH_OVERRIDE;
        const errors: string[] = [];
        if (r.maxWords !== 50) errors.push(`maxWords: expected=50 got=${r.maxWords}`);
        if (r.minWords !== 10) errors.push(`minWords: expected=10 got=${r.minWords}`);
        if (r.maxSentences !== 2) errors.push(`maxSentences: expected=2 got=${r.maxSentences}`);
        if (!r.requiredSections.includes("summary")) errors.push("Missing required: summary");
        if (!r.requiredSections.includes("foundation")) errors.push("Missing required: foundation");
        if (!r.forbiddenSections.includes("scenarios")) errors.push("Missing forbidden: scenarios");
        if (!r.forbiddenSections.includes("consequences")) errors.push("Missing forbidden: consequences");
        if (!r.forbiddenSections.includes("relatedArticles")) errors.push("Missing forbidden: relatedArticles");
        if (!r.forbiddenSections.includes("legalInterpretation")) errors.push("Missing forbidden: legalInterpretation");
        console.log(`  Words: ${r.minWords}-${r.maxWords} | Sentences: max ${r.maxSentences}`);
        console.log(`  Required: [${r.requiredSections.join(", ")}]`);
        console.log(`  Forbidden: [${r.forbiddenSections.join(", ")}]`);
        checkResult(1, "Override rule configuration", errors);
    }

    // ─── Test 2: getEffectiveDepthRule returns override for follow-ups ───
    console.log(`\n${"─".repeat(60)}`);
    console.log(`TEST #2: getEffectiveDepthRule returns override when isFollowUp=true`);
    console.log(`${"─".repeat(60)}`);
    {
        const errors: string[] = [];
        const details: ("simple" | "detailed" | "technical")[] = ["simple", "detailed", "technical"];
        for (const detail of details) {
            const rule = getEffectiveDepthRule(detail, true);
            if (rule !== FOLLOW_UP_DEPTH_OVERRIDE) {
                errors.push(`${detail}: expected FOLLOW_UP override, got ${rule.label}`);
            }
            console.log(`  ${detail} + followUp=true → ${rule.label} ✓`);
        }
        // Non-follow-up should return normal
        for (const detail of details) {
            const rule = getEffectiveDepthRule(detail, false);
            if (rule !== DEPTH_RULES[detail]) {
                errors.push(`${detail}: expected DEPTH_RULES[${detail}], got ${rule.label}`);
            }
        }
        checkResult(2, "getEffectiveDepthRule routing", errors);
    }

    // ─── Test 3: Token multiplier ────────────────────────────────────────
    console.log(`\n${"─".repeat(60)}`);
    console.log(`TEST #3: Token multiplier = 0.5`);
    console.log(`${"─".repeat(60)}`);
    {
        const errors: string[] = [];
        if (FOLLOW_UP_TOKEN_MULTIPLIER !== 0.5) {
            errors.push(`multiplier: expected=0.5 got=${FOLLOW_UP_TOKEN_MULTIPLIER}`);
        }
        const complexities: ("simple" | "normal" | "complex")[] = ["simple", "normal", "complex"];
        for (const c of complexities) {
            const base = RETRIEVAL_CONFIG[c].tokens;
            const compressed = Math.floor(base * FOLLOW_UP_TOKEN_MULTIPLIER);
            console.log(`  ${c}: ${base} → ${compressed} tokens`);
            if (compressed >= base) {
                errors.push(`${c}: compressed (${compressed}) should be < base (${base})`);
            }
        }
        checkResult(3, "Token multiplier reduction", errors);
    }

    // ─── Test 4: Follow-up prompt contains compression instructions ──────
    console.log(`\n${"─".repeat(60)}`);
    console.log(`TEST #4: Follow-up prompt contains compression block`);
    console.log(`${"─".repeat(60)}`);
    {
        const errors: string[] = [];
        const mockAnalysis: QueryAnalysis = {
            complexity: "normal",
            mode: "professional",
            detail: "detailed",
            retrievalDepth: 4,
            tokenLimit: 350,
            detectedIntent: "general"
        };
        const prompt = buildSystemPrompt({
            message: "¿de cuánto es la cuota?",
            mode: "casual",
            detailLevel: "detallada",
            topic: "continuacion_voluntaria_imss",
            legalContext: [],
            queryAnalysis: mockAnalysis,
            isFollowUp: true,
            previousTopic: "continuacion_voluntaria_imss"
        });

        const checks = [
            "SEGUIMIENTO DETECTADA",
            "MÁXIMO 2 oraciones",
            "MÁXIMO 50 palabras",
            "NO repitas explicaciones anteriores",
            "PROHIBIDAS"
        ];

        for (const check of checks) {
            if (!prompt.includes(check)) {
                errors.push(`Missing in prompt: "${check}"`);
            }
        }

        // Should NOT contain normal depth rules header
        if (prompt.includes("REGLAS DE PROFUNDIDAD (OBLIGATORIO)")) {
            errors.push("Should not contain normal depth rules header when follow-up");
        }

        // Should NOT contain intent suffix (skipped for follow-ups)
        if (prompt.includes("INSTRUCCIONES ADICIONALES POR INTENT")) {
            errors.push("Should not contain intent suffix for follow-up");
        }

        console.log(`  Prompt length: ${prompt.length} chars`);
        console.log(`  Contains compression block: ${prompt.includes("REGLAS DE COMPRESIÓN") ? "✓" : "✗"}`);
        checkResult(4, "Follow-up prompt compression block", errors);
    }

    // ─── Test 5: Non-follow-up prompt does NOT contain compression ───────
    console.log(`\n${"─".repeat(60)}`);
    console.log(`TEST #5: Non-follow-up prompt uses normal depth rules`);
    console.log(`${"─".repeat(60)}`);
    {
        const errors: string[] = [];
        const mockAnalysis: QueryAnalysis = {
            complexity: "normal",
            mode: "professional",
            detail: "detailed",
            retrievalDepth: 4,
            tokenLimit: 350,
            detectedIntent: "general"
        };
        const prompt = buildSystemPrompt({
            message: "qué obligaciones tiene un contribuyente persona física",
            mode: "profesional",
            detailLevel: "detallada",
            topic: "obligaciones",
            legalContext: [],
            queryAnalysis: mockAnalysis,
            isFollowUp: false
        });

        if (!prompt.includes("REGLAS DE PROFUNDIDAD (OBLIGATORIO)")) {
            errors.push("Missing normal depth rules header");
        }
        if (prompt.includes("REGLAS DE COMPRESIÓN")) {
            errors.push("Should not contain compression rules for non-follow-up");
        }
        if (prompt.includes("SEGUIMIENTO DETECTADA")) {
            errors.push("Should not contain follow-up block for non-follow-up");
        }

        console.log(`  Prompt length: ${prompt.length} chars`);
        console.log(`  Contains normal depth rules: ${prompt.includes("REGLAS DE PROFUNDIDAD") ? "✓" : "✗"}`);
        checkResult(5, "Non-follow-up uses normal depth rules", errors);
    }

    // ─── Test 6: Override maxWords < all DEPTH_RULES minWords ────────────
    console.log(`\n${"─".repeat(60)}`);
    console.log(`TEST #6: Override is strictly smaller than all normal depth rules`);
    console.log(`${"─".repeat(60)}`);
    {
        const errors: string[] = [];
        const override = FOLLOW_UP_DEPTH_OVERRIDE;
        const details: ("simple" | "detailed" | "technical")[] = ["simple", "detailed", "technical"];
        for (const d of details) {
            const normal = DEPTH_RULES[d];
            if (override.maxWords >= normal.maxWords) {
                errors.push(`override.maxWords (${override.maxWords}) should be < ${d}.maxWords (${normal.maxWords})`);
            }
            console.log(`  followUp.max(${override.maxWords}) < ${d}.max(${normal.maxWords}): ✓`);
        }
        checkResult(6, "Override smaller than all normal rules", errors);
    }

    // ─── Test 7: Follow-up detection → compression integration ──────────
    console.log(`\n${"─".repeat(60)}`);
    console.log(`TEST #7: Follow-up detection integrates with compression`);
    console.log(`${"─".repeat(60)}`);
    {
        const errors: string[] = [];

        // Case A: Follow-up detected → compression should apply
        const resultA = detectFollowUp("¿de cuánto es la cuota?", MOCK_CONTEXT);
        if (!resultA.isFollowUp) {
            errors.push("Case A: should detect follow-up");
        }
        const ruleA = getEffectiveDepthRule("detailed", resultA.isFollowUp);
        if (ruleA !== FOLLOW_UP_DEPTH_OVERRIDE) {
            errors.push("Case A: should use override rule");
        }
        console.log(`  Case A: "¿de cuánto es la cuota?" → followUp=${resultA.isFollowUp} → ${ruleA.label}`);

        // Case B: Independent → normal rules
        const resultB = detectFollowUp("cómo se calcula el ISR de personas físicas bajo el régimen RESICO con ingresos mixtos y deducciones personales", MOCK_CONTEXT);
        if (resultB.isFollowUp) {
            errors.push("Case B: should NOT detect follow-up");
        }
        const ruleB = getEffectiveDepthRule("detailed", resultB.isFollowUp);
        if (ruleB !== DEPTH_RULES["detailed"]) {
            errors.push("Case B: should use normal detailed rule");
        }
        console.log(`  Case B: long independent query → followUp=${resultB.isFollowUp} → ${ruleB.label}`);

        checkResult(7, "Follow-up detection → compression integration", errors);
    }

    // ─── Test 8: Token compression values are correct ────────────────────
    console.log(`\n${"─".repeat(60)}`);
    console.log(`TEST #8: Token compression produces correct values`);
    console.log(`${"─".repeat(60)}`);
    {
        const errors: string[] = [];
        const expected: { complexity: "simple" | "normal" | "complex"; base: number; compressed: number }[] = [
            { complexity: "simple", base: RETRIEVAL_CONFIG.simple.tokens, compressed: Math.floor(RETRIEVAL_CONFIG.simple.tokens * 0.5) },
            { complexity: "normal", base: RETRIEVAL_CONFIG.normal.tokens, compressed: Math.floor(RETRIEVAL_CONFIG.normal.tokens * 0.5) },
            { complexity: "complex", base: RETRIEVAL_CONFIG.complex.tokens, compressed: Math.floor(RETRIEVAL_CONFIG.complex.tokens * 0.5) }
        ];
        for (const e of expected) {
            console.log(`  ${e.complexity}: ${e.base} → ${e.compressed} (50% reduction)`);
            if (e.compressed !== Math.floor(e.base * FOLLOW_UP_TOKEN_MULTIPLIER)) {
                errors.push(`${e.complexity}: expected ${Math.floor(e.base * 0.5)} got ${e.compressed}`);
            }
            if (e.compressed >= e.base) {
                errors.push(`${e.complexity}: compressed >= base`);
            }
        }
        checkResult(8, "Token compression values", errors);
    }

    // ─── Summary ─────────────────────────────────────────────────────────
    const total = results.length;
    console.log(`\n\n${"═".repeat(60)}`);
    console.log("SUMMARY TABLE");
    console.log(`${"═".repeat(60)}`);
    console.log(`${"#".padEnd(4)} ${"Description".padEnd(50)} ${"Status"}`);
    console.log(`${"─".repeat(60)}`);
    for (const r of results) {
        console.log(`${String(r.id).padEnd(4)} ${r.description.substring(0, 50).padEnd(50)} ${r.status}`);
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

runFollowUpTests();
