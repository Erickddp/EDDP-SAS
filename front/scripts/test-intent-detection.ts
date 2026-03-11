/**
 * Test Intent Detection — 10 real MyFiscal queries to validate intent classification.
 * 
 * Usage: npm run test:intents
 */

import "./load-env";
import { analyzeQueryWithDebug } from "../lib/query-analyzer";
import { ChatMode, DetailLevel } from "../lib/types";
import { LegalIntent } from "../lib/intent-templates";

interface IntentTestCase {
    id: number;
    query: string;
    mode: ChatMode;
    detailLevel: DetailLevel;
    expectedIntent: LegalIntent;
    expectedComplexity: "simple" | "normal" | "complex";
    description: string;
}

const INTENT_TEST_CASES: IntentTestCase[] = [
    {
        id: 1,
        query: "cuánto es la multa por no presentar declaración anual",
        mode: "casual",
        detailLevel: "sencilla",
        expectedIntent: "multa",
        expectedComplexity: "simple",
        description: "Multa simple — monto de sanción por omisión"
    },
    {
        id: 2,
        query: "qué multa me aplica si no emito CFDI y cuáles son los factores agravantes",
        mode: "profesional",
        detailLevel: "detallada",
        expectedIntent: "multa",
        expectedComplexity: "normal",
        description: "Multa normal — CFDI con factores agravantes"
    },
    {
        id: 3,
        query: "cuánto es la multa por no inscribirse al RFC",
        mode: "casual",
        detailLevel: "sencilla",
        expectedIntent: "multa",
        expectedComplexity: "simple",
        description: "Multa simple — RFC omisión"
    },
    {
        id: 4,
        query: "cómo se calcula el ISR de personas físicas RESICO",
        mode: "profesional",
        detailLevel: "tecnica",
        expectedIntent: "calculo",
        expectedComplexity: "normal",
        description: "Cálculo normal — ISR RESICO"
    },
    {
        id: 5,
        query: "cuál es la fórmula para calcular recargos y actualización de contribuciones omitidas",
        mode: "profesional",
        detailLevel: "tecnica",
        expectedIntent: "calculo",
        expectedComplexity: "normal",
        description: "Cálculo normal — recargos y actualización"
    },
    {
        id: 6,
        query: "cómo se calcula el IVA acreditable proporcional",
        mode: "casual",
        detailLevel: "detallada",
        expectedIntent: "calculo",
        expectedComplexity: "normal",
        description: "Cálculo normal — IVA acreditable"
    },
    {
        id: 7,
        query: "cuándo se presenta la declaración anual de personas físicas",
        mode: "casual",
        detailLevel: "sencilla",
        expectedIntent: "plazo",
        expectedComplexity: "simple",
        description: "Plazo simple — declaración anual"
    },
    {
        id: 8,
        query: "cuál es la fecha límite para pagos provisionales de ISR mensual",
        mode: "profesional",
        detailLevel: "detallada",
        expectedIntent: "plazo",
        expectedComplexity: "simple",
        description: "Plazo simple — pagos provisionales"
    },
    {
        id: 9,
        query: "cuándo vence el plazo para presentar declaración bimestral RESICO y qué pasa si es extemporáneo",
        mode: "profesional",
        detailLevel: "tecnica",
        expectedIntent: "plazo",
        expectedComplexity: "normal",
        description: "Plazo normal — bimestral RESICO con consecuencias"
    },
    {
        id: 10,
        query: "qué obligaciones tiene un contribuyente persona física con actividad empresarial",
        mode: "casual",
        detailLevel: "detallada",
        expectedIntent: "general",
        expectedComplexity: "normal",
        description: "General — obligaciones (no multa/cálculo/plazo)"
    }
];

async function runIntentTests() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║       INTENT DETECTION TEST — Phase 3 Validation        ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    let passed = 0;
    let failed = 0;
    const results: { id: number; description: string; status: string; details: string }[] = [];

    for (const tc of INTENT_TEST_CASES) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`TEST #${tc.id}: ${tc.description}`);
        console.log(`Query: "${tc.query}"`);
        console.log(`${"─".repeat(60)}`);

        const { analysis, debug } = analyzeQueryWithDebug(tc.query, tc.mode, tc.detailLevel);
        const errors: string[] = [];

        // Intent check
        if (analysis.detectedIntent !== tc.expectedIntent) {
            errors.push(`Intent: expected=${tc.expectedIntent} got=${analysis.detectedIntent}`);
        }

        // Complexity check
        if (analysis.complexity !== tc.expectedComplexity) {
            errors.push(`Complexity: expected=${tc.expectedComplexity} got=${analysis.complexity}`);
        }

        const status = errors.length === 0 ? "PASS ✅" : "FAIL ❌";
        if (errors.length === 0) passed++; else failed++;

        console.log(`\n  Result: ${status}`);
        console.log(`  Intent: ${analysis.detectedIntent} | Complexity: ${analysis.complexity} (score: ${debug.rawScore})`);
        if (errors.length > 0) {
            errors.forEach(e => console.log(`    ⚠ ${e}`));
        }

        results.push({ id: tc.id, description: tc.description, status, details: errors.join("; ") || "OK" });
    }

    // Summary
    console.log(`\n\n${"═".repeat(60)}`);
    console.log("SUMMARY TABLE");
    console.log(`${"═".repeat(60)}`);
    console.log(`${"#".padEnd(4)} ${"Intent".padEnd(10)} ${"Description".padEnd(38)} ${"Status"}`);
    console.log(`${"─".repeat(60)}`);
    for (const r of results) {
        const intent = INTENT_TEST_CASES.find(t => t.id === r.id)?.expectedIntent || "";
        console.log(`${String(r.id).padEnd(4)} ${intent.padEnd(10)} ${r.description.substring(0, 38).padEnd(38)} ${r.status}`);
    }
    console.log(`${"─".repeat(60)}`);
    console.log(`PASSED: ${passed}/${INTENT_TEST_CASES.length} | FAILED: ${failed}/${INTENT_TEST_CASES.length}`);

    if (failed > 0) {
        console.log("\n⚠ FAILURES:");
        results.filter(r => r.status.includes("FAIL")).forEach(r => {
            console.log(`  Test #${r.id}: ${r.details}`);
        });
    }

    process.exit(failed > 0 ? 1 : 0);
}

runIntentTests();
