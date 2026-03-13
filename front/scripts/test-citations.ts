import { config } from "dotenv";

config({ path: ".env.local" });

const API_URL = "http://localhost:3000/api/chat";

async function runCitationsTest() {
    console.log("🧪 Iniciando pruebas de Traceability Layer (Phase 6B)...\n");

    const tests = [
        {
            name: "Simple",
            body: {
                message: "¿Qué es enajenación de bienes según el artículo 14 del CFF?",
                conversationId: "test-cit-" + Date.now(),
                mode: "casual" as const,
                detailLevel: "sencilla" as const
            }
        },
        {
            name: "Detailed Multa",
            body: {
                message: "¿Cuánto es la multa según el artículo 81 del CFF por no presentar declaraciones?",
                conversationId: "test-cit-" + Date.now(),
                mode: "casual" as const,
                detailLevel: "detallada" as const
            }
        },
        {
            name: "Technical",
            body: {
                message: "Explica el artículo 14 del CFF y sus correlacionados.",
                conversationId: "test-cit-" + Date.now(),
                mode: "profesional" as const,
                detailLevel: "tecnica" as const
            }
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        console.log(`▶ TEST (Traceability): ${test.name} ...`);
        console.log(`  Pregunta: "${test.body.message}"`);

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(test.body)
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }

            const data = await res.json();
            const answer = data.answer;
            const debug = data._debug;

            // Basic Traceability assertions
            const citations = answer.citations;
            const hasCitationsArray = Array.isArray(citations);
            
            if (!hasCitationsArray) {
                console.error("  ❌ FAIL: No se devolvió la llave 'citations'.");
                failed++;
                continue;
            }

            const debugValidated = debug?.traceabilityValidated === true;
            if (!debugValidated) {
                console.error("  ❌ FAIL: Traceability no validado (Probablemente falty summaryCitations).");
                console.log("  Answer: ", JSON.stringify(answer, null, 2));
                failed++;
                continue;
            }

            // Verify mapping to retrieved sources
            const retrievedIds = debug?.topSources ? new Set(data.sources.map((s: any) => s.id)) : new Set();
            const validSourceIds = citations.every((c: any) => retrievedIds.has(c.sourceId));

            if (!validSourceIds) {
                console.error("  ❌ FAIL: Una o más citas referencian un sourceId no recuperado en esta ventana.");
                failed++;
                continue;
            }

            // Verify schema sections match the configuration (Citations presence)
            if (test.body.detailLevel === "sencilla") {
                if (
                    (Array.isArray(answer.explanationCitations) && answer.explanationCitations.length > 0) ||
                    (Array.isArray(answer.exampleCitations) && answer.exampleCitations.length > 0)
                ) {
                    console.error("  ❌ FAIL: Nivel sencillo no debería incluir explicaciones ni ejemplos.");
                    console.log("  Answer: ", JSON.stringify(answer, null, 2));
                    failed++;
                    continue;
                }
            } else {
                if (!Array.isArray(answer.explanationCitations)) {
                    console.error("  ❌ FAIL: Nivel avanzado debería incluir explanationCitations.");
                    console.log("  Answer: ", JSON.stringify(answer, null, 2));
                    failed++;
                    continue;
                }
            }

            console.log(`  ✅ PASS (Citas encontradas: ${citations.length}, Válidas: ${debug.citationsCount}, Removidas por fake: ${debug.invalidCitationsRemoved})`);
            passed++;

        } catch (error) {
            console.error(`  ❌ FAILED: ${error}\n`);
            failed++;
        }
    }

    console.log(`\n════════════════════════════════════════════════════════`);
    console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`════════════════════════════════════════════════════════\n`);

    if (failed > 0) process.exit(1);
}

runCitationsTest();
