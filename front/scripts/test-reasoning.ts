import "./load-env";
import { analyzeQueryWithDebug } from "../lib/query-analyzer";

async function testIntentDetection() {
    console.log("\n--- TESTING INTENT DETECTION ---");
    const testCases = [
        {
            query: "¿Qué derechos tengo si no trabajo?",
            expectedDomain: "constitucional",
            expectedType: "derechos"
        },
        {
            query: "cuánto es la multa por no declarar",
            expectedDomain: "fiscal",
            expectedType: "multa"
        },
        {
            query: "cómo calculo mi ISR del mes",
            expectedDomain: "fiscal",
            expectedType: "calculo"
        },
        {
            query: "plazo para pagar el IVA",
            expectedDomain: "fiscal",
            expectedType: "plazo"
        },
        {
            query: "fundamentar una multa del SAT por no declarar",
            expectedDomain: "fiscal",
            expectedType: "fundamentar"
        },
        {
            query: "sustento legal de un requerimiento del IMSS",
            expectedDomain: "fiscal",
            expectedType: "fundamentar"
        }
    ];

    for (const tc of testCases) {
        const { analysis } = analyzeQueryWithDebug(tc.query, "casual", "sencilla");
        const si = analysis.structuredIntent;
        const pass = si?.legalDomain === tc.expectedDomain && si?.intentType === tc.expectedType;
        
        console.log(`Query: "${tc.query}"`);
        console.log(`  Expected: ${tc.expectedDomain}/${tc.expectedType}`);
        console.log(`  Got:      ${si?.legalDomain}/${si?.intentType} [${pass ? "PASS" : "FAIL"}]`);
        console.log(`  Entities: [${si?.entities.join(", ")}]`);
        console.log(`  Outcome:  ${si?.desiredOutcome}`);
    }
}

async function runTests() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║       LEGAL REASONING ENGINE TESTS — PHASE 7A           ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    
    await testIntentDetection();
    
    console.log("\n--- PHASE 2: COMPLETE ---");
}

runTests().catch(console.error);
