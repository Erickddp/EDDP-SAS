/**
 * Test Conversational Memory — Validates follow-up detection heuristics.
 * 
 * Usage: npm run test:memory
 */

import "./load-env";
import { detectFollowUp, ConversationContext } from "../lib/conversation-context";

interface MemoryTestCase {
    id: number;
    message: string;
    hasPreviousContext: boolean;
    expectedFollowUp: boolean;
    description: string;
}

const MOCK_CONTEXT: ConversationContext = {
    lastTopic: "continuacion_voluntaria_imss",
    lastIntent: "general",
    lastSources: ["LSS Art. 12", "LSS Art. 218"],
    lastArticleIds: [],
    lastLaw: "LSS",
    lastQuery: "Si dejo de trabajar puedo seguir en el IMSS",
    updatedAt: Date.now()
};

const MEMORY_TEST_CASES: MemoryTestCase[] = [
    {
        id: 1,
        message: "¿de cuánto es la cuota?",
        hasPreviousContext: true,
        expectedFollowUp: true,
        description: "Short follow-up about cuota (pronoun-free, short)"
    },
    {
        id: 2,
        message: "¿cuál es la multa?",
        hasPreviousContext: true,
        expectedFollowUp: true,
        description: "Short follow-up asking about multa"
    },
    {
        id: 3,
        message: "¿y el plazo?",
        hasPreviousContext: true,
        expectedFollowUp: true,
        description: "Follow-up starter 'y el'"
    },
    {
        id: 4,
        message: "¿y si no pago?",
        hasPreviousContext: true,
        expectedFollowUp: true,
        description: "Follow-up starter '¿y si'"
    },
    {
        id: 5,
        message: "pero eso aplica también para jubilados?",
        hasPreviousContext: true,
        expectedFollowUp: true,
        description: "Pronoun reference 'eso' with starter 'pero'"
    },
    {
        id: 6,
        message: "entonces cuánto debo pagar mensualmente",
        hasPreviousContext: true,
        expectedFollowUp: true,
        description: "Follow-up starter 'entonces'"
    },
    {
        id: 7,
        message: "cómo se calcula el ISR de personas físicas bajo el régimen RESICO con ingresos mixtos y deducciones personales",
        hasPreviousContext: true,
        expectedFollowUp: false,
        description: "Long independent question with new legal entities"
    },
    {
        id: 8,
        message: "qué obligaciones tiene un contribuyente persona física con actividad empresarial ante el SAT según el CFF",
        hasPreviousContext: true,
        expectedFollowUp: false,
        description: "Long new topic with specific law references"
    },
    {
        id: 9,
        message: "¿de cuánto es la cuota?",
        hasPreviousContext: false,
        expectedFollowUp: false,
        description: "Short question but NO previous context"
    },
    {
        id: 10,
        message: "artículo 27 del CFF fracción III qué establece",
        hasPreviousContext: true,
        expectedFollowUp: false,
        description: "Specific article reference = new independent query"
    }
];

async function runMemoryTests() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║     CONVERSATIONAL MEMORY TEST — Phase 4A Validation    ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    let passed = 0;
    let failed = 0;
    const results: { id: number; description: string; status: string; details: string }[] = [];

    for (const tc of MEMORY_TEST_CASES) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`TEST #${tc.id}: ${tc.description}`);
        console.log(`Message: "${tc.message}"`);
        console.log(`Has Previous Context: ${tc.hasPreviousContext}`);
        console.log(`${"─".repeat(60)}`);

        const ctx = tc.hasPreviousContext ? MOCK_CONTEXT : null;
        const result = detectFollowUp(tc.message, ctx);
        const errors: string[] = [];

        if (result.isFollowUp !== tc.expectedFollowUp) {
            errors.push(`FollowUp: expected=${tc.expectedFollowUp} got=${result.isFollowUp} (reason: ${result.reason})`);
        }

        const status = errors.length === 0 ? "PASS ✅" : "FAIL ❌";
        if (errors.length === 0) passed++; else failed++;

        console.log(`\n  Result: ${status}`);
        console.log(`  FollowUp: ${result.isFollowUp} | Reason: ${result.reason}`);
        if (errors.length > 0) {
            errors.forEach(e => console.log(`    ⚠ ${e}`));
        }

        results.push({ id: tc.id, description: tc.description, status, details: errors.join("; ") || "OK" });
    }

    // Summary
    console.log(`\n\n${"═".repeat(60)}`);
    console.log("SUMMARY TABLE");
    console.log(`${"═".repeat(60)}`);
    console.log(`${"#".padEnd(4)} ${"Expected".padEnd(10)} ${"Description".padEnd(40)} ${"Status"}`);
    console.log(`${"─".repeat(60)}`);
    for (const r of results) {
        const expected = MEMORY_TEST_CASES.find(t => t.id === r.id)?.expectedFollowUp ? "followUp" : "new";
        console.log(`${String(r.id).padEnd(4)} ${expected.padEnd(10)} ${r.description.substring(0, 40).padEnd(40)} ${r.status}`);
    }
    console.log(`${"─".repeat(60)}`);
    console.log(`PASSED: ${passed}/${MEMORY_TEST_CASES.length} | FAILED: ${failed}/${MEMORY_TEST_CASES.length}`);

    if (failed > 0) {
        console.log("\n⚠ FAILURES:");
        results.filter(r => r.status.includes("FAIL")).forEach(r => {
            console.log(`  Test #${r.id}: ${r.details}`);
        });
    }

    console.log(`${"═".repeat(60)}`);
    process.exit(failed > 0 ? 1 : 0);
}

runMemoryTests();
