/**
 * Test Adaptive Engine — 6-case matrix that validates classification + retrieval.
 * 
 * Runs offline heuristic tests (no OpenAI),
 * then optionally runs live DB retrieval to verify article counts.
 * 
 * Usage: npm run test:adaptive
 */

import "./load-env";
import { analyzeQueryWithDebug } from "../lib/query-analyzer";
import { ChatMode, DetailLevel } from "../lib/types";
import { RETRIEVAL_CONFIG } from "../lib/retrieval-config";

// ─── Test Case Definitions ──────────────────────────────────────────────────

interface TestCase {
    id: number;
    query: string;
    mode: ChatMode;
    detailLevel: DetailLevel;
    expectedComplexity: "simple" | "normal" | "complex";
    expectedMinArticles: number;
    expectedMaxArticles: number;
    description: string;
}

const TEST_CASES: TestCase[] = [
    {
        id: 1,
        query: "cuánto es la multa resico",
        mode: "casual",
        detailLevel: "sencilla",
        expectedComplexity: "simple",
        expectedMinArticles: 1,
        expectedMaxArticles: 2,
        description: "Simple / Casual / Simple"
    },
    {
        id: 2,
        query: "cuánto es la multa resico",
        mode: "profesional",
        detailLevel: "tecnica",
        expectedComplexity: "normal",  // elevated from simple by user pref
        expectedMinArticles: 3,
        expectedMaxArticles: 4,
        description: "Simple query / Professional / Technical (should elevate)"
    },
    {
        id: 3,
        query: "cuándo aplica multa por omisión de declaración",
        mode: "casual",
        detailLevel: "detallada",
        expectedComplexity: "normal",
        expectedMinArticles: 3,
        expectedMaxArticles: 4,
        description: "Normal / Casual / Detailed"
    },
    {
        id: 4,
        query: "cuándo aplica multa por omisión de declaración",
        mode: "profesional",
        detailLevel: "detallada",
        expectedComplexity: "normal",
        expectedMinArticles: 3,
        expectedMaxArticles: 4,
        description: "Normal / Professional / Detailed"
    },
    {
        id: 5,
        query: "cómo se calcula multa y recargos por omisión ISR RESICO con actualizaciones según CFF",
        mode: "profesional",
        detailLevel: "tecnica",
        expectedComplexity: "complex",
        expectedMinArticles: 5,
        expectedMaxArticles: 7,
        description: "Complex / Professional / Technical"
    },
    {
        id: 6,
        query: "cómo se calcula multa y recargos por omisión ISR RESICO con actualizaciones según CFF",
        mode: "casual",
        detailLevel: "detallada",
        expectedComplexity: "complex",
        expectedMinArticles: 5,
        expectedMaxArticles: 7,
        description: "Complex / Casual / Detailed"
    }
];

// ─── Runner ─────────────────────────────────────────────────────────────────

async function runTestMatrix() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║     ADAPTIVE ENGINE TEST MATRIX — Phase 2 Validation    ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    let passed = 0;
    let failed = 0;
    const results: { id: number; description: string; status: string; details: string }[] = [];

    for (const tc of TEST_CASES) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`TEST #${tc.id}: ${tc.description}`);
        console.log(`Query: "${tc.query}"`);
        console.log(`Mode: ${tc.mode} | Detail: ${tc.detailLevel}`);
        console.log(`${"─".repeat(60)}`);

        const { analysis, debug } = analyzeQueryWithDebug(tc.query, tc.mode, tc.detailLevel);
        const config = RETRIEVAL_CONFIG[analysis.complexity];

        // ─── Assertions ─────────────────────────────────────────────────
        const errors: string[] = [];

        // 1. Complexity check
        if (analysis.complexity !== tc.expectedComplexity) {
            errors.push(`Complexity: expected=${tc.expectedComplexity} got=${analysis.complexity}`);
        }

        // 2. Article count range check
        if (config.articles < tc.expectedMinArticles || config.articles > tc.expectedMaxArticles) {
            errors.push(`Articles: expected ${tc.expectedMinArticles}-${tc.expectedMaxArticles}, got=${config.articles}`);
        }

        // 3. Mode propagation check
        const expectedMode = tc.mode === "profesional" ? "professional" : "casual";
        if (analysis.mode !== expectedMode) {
            errors.push(`Mode: expected=${expectedMode} got=${analysis.mode}`);
        }

        // 4. Elevation check (case 2)
        if (tc.id === 2 && !debug.elevatedByUser) {
            errors.push(`Elevation: expected elevatedByUser=true, got=false`);
        }

        // 5. Token limit sanity
        if (analysis.tokenLimit !== config.tokens) {
            errors.push(`TokenLimit: mismatch analysis=${analysis.tokenLimit} config=${config.tokens}`);
        }

        // ─── Result ─────────────────────────────────────────────────────
        const status = errors.length === 0 ? "PASS ✅" : "FAIL ❌";
        if (errors.length === 0) passed++; else failed++;

        console.log(`\n  Result: ${status}`);
        console.log(`  Complexity: ${analysis.complexity} (score: ${debug.rawScore})`);
        console.log(`  Articles: ${config.articles} | Tokens: ${config.tokens}`);
        console.log(`  Mode: ${analysis.mode} | Detail: ${analysis.detail}`);
        console.log(`  Elevated: ${debug.elevatedByUser}`);
        if (errors.length > 0) {
            console.log(`  ERRORS:`);
            errors.forEach(e => console.log(`    ⚠ ${e}`));
        }

        results.push({
            id: tc.id,
            description: tc.description,
            status,
            details: errors.length > 0 ? errors.join("; ") : "All assertions passed"
        });
    }

    // ─── Summary Table ──────────────────────────────────────────────────
    console.log(`\n\n${"═".repeat(60)}`);
    console.log("SUMMARY TABLE");
    console.log(`${"═".repeat(60)}`);
    console.log(`${"#".padEnd(4)} ${"Description".padEnd(42)} ${"Status".padEnd(10)}`);
    console.log(`${"─".repeat(60)}`);
    for (const r of results) {
        console.log(`${String(r.id).padEnd(4)} ${r.description.padEnd(42)} ${r.status}`);
    }
    console.log(`${"─".repeat(60)}`);
    console.log(`PASSED: ${passed}/${TEST_CASES.length} | FAILED: ${failed}/${TEST_CASES.length}`);

    if (failed > 0) {
        console.log("\n⚠ FAILURES DETECTED:");
        results.filter(r => r.status.includes("FAIL")).forEach(r => {
            console.log(`  Test #${r.id}: ${r.details}`);
        });
    }

    console.log(`\n${"═".repeat(60)}`);

    // ─── Optional: Live DB Retrieval Test ────────────────────────────────
    const runLiveDB = process.argv.includes("--live");
    if (runLiveDB) {
        console.log("\n\n🔌 LIVE DB RETRIEVAL TEST (PostgreSQL Lexical)");
        console.log("─".repeat(60));
        
        try {
            const { searchPostgresArticles } = await import("../lib/pg-retrieval");
            const { parseLegalReference } = await import("../lib/law-alias");

            for (const tc of [TEST_CASES[0], TEST_CASES[4]]) {
                const parsedRef = parseLegalReference(tc.query);
                const { analysis } = analyzeQueryWithDebug(tc.query, tc.mode, tc.detailLevel);
                const config = RETRIEVAL_CONFIG[analysis.complexity];
                
                console.log(`\n  Query: "${tc.query}" → limit=${config.articles}`);
                const dbResults = await searchPostgresArticles(tc.query, config.articles, parsedRef);
                console.log(`  Retrieved: ${dbResults.length} articles from PostgreSQL`);
                dbResults.forEach((r: any, i: number) => {
                    console.log(`    ${i+1}. ${r.documentAbbreviation} Art. ${r.articleNumber}`);
                });

                if (dbResults.length === 0) {
                    console.log("  ⚠️ No se encontraron resultados en PostgreSQL. Verifica que los datos estén cargados.");
                } else if (dbResults.length > config.articles) {
                    console.log(`  ⚠ WARNING: Got more articles (${dbResults.length}) than requested (${config.articles})`);
                }
            }
        } catch (err) {
            console.error("  DB test failed:", (err as Error).message);
        }
    } else {
        console.log("\nTip: Run with --live flag to also test DB retrieval");
    }

    process.exit(failed > 0 ? 1 : 0);
}

runTestMatrix();
