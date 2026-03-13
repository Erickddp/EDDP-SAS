import { config } from "dotenv";

config({ path: ".env.local" });

const API_URL = "http://localhost:3000/api/chat";

async function runAuthorityRankingTest() {
    console.log("🧪 Iniciando pruebas de Legal Authority Ranking (Phase 7B)...\n");

    const tests = [
        {
            name: "Multa CFF Priority",
            body: {
                message: "¿Cuál es la multa por no presentar declaración mensual?",
                conversationId: "test-auth-multa-" + Date.now() + Math.random(),
                mode: "casual",
                detailLevel: "detallada"
            },
            expectedPriorityLaw: "CFF"
        },
        {
            name: "IVA LIVA Priority",
            body: {
                message: "¿Qué actos están gravados con IVA?",
                conversationId: "test-auth-iva-" + Date.now() + Math.random(),
                mode: "casual",
                detailLevel: "detallada"
            },
            expectedPriorityLaw: "LIVA"
        },
        {
            name: "Recargos CFF Priority",
            body: {
                message: "¿Cómo se calculan los recargos?",
                conversationId: "test-auth-recargos-" + Date.now() + Math.random(),
                mode: "casual",
                detailLevel: "detallada"
            },
            expectedPriorityLaw: "CFF"
        },
        {
            name: "Exact Article Primary",
            body: {
                message: "Dime el artículo 27 del CFF",
                conversationId: "test-auth-art27-" + Date.now() + Math.random(),
                mode: "casual",
                detailLevel: "sencilla"
            },
            expectedPrimaryArticle: "CFF 27"
        },
        {
            name: "Fundamentar Requerimiento",
            body: {
                message: "Fundamenta legalmente un requerimiento de contabilidad por el SAT",
                conversationId: "test-auth-fund-" + Date.now() + Math.random(),
                mode: "profesional",
                detailLevel: "tecnica"
            },
            validateFundamentar: true
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        console.log(`▶ TEST: ${test.name} ...`);
        console.log(`  Query: "${test.body.message}"`);

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(test.body)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text}`);
            }

            const data = await res.json();
            const answer = data.answer;
            const debug = data._debug;

            // 1. Authority Ranking Applied
            if (!debug.authorityRankingApplied) {
                console.error("  ❌ FAIL: authorityRankingApplied=false");
                failed++;
                continue;
            }

            // 2. Exact Primary Match if specified
            if (test.expectedPrimaryArticle) {
                const primaryRef = debug.primaryBasisRef?.toUpperCase() || "";
                const primaryLaw = debug.primaryBasisLaw?.toUpperCase() || "";
                // e.g. "CFF 27" -> Law=CFF, articleNumber includes 27
                const [expectedLaw, expectedNum] = test.expectedPrimaryArticle.split(" ");
                // Flexible match: law matches and ID contains the article number (e.g. "04-art-27" or "norm:04:70")
                // We'll also check if the debug.primaryBasisRef itself starts with the law prefix or contains the number
                const numPattern = new RegExp(`\\b${expectedNum}\\b`);
                const match = primaryLaw === expectedLaw && (
                    numPattern.test(primaryRef) || 
                    primaryRef.toLowerCase().includes(`art-${expectedNum.toLowerCase()}`) ||
                    primaryRef.toLowerCase().includes(`art.${expectedNum.toLowerCase()}`)
                );
                
                if (!match) {
                    console.error(`  ❌ FAIL: Se esperaba primaryBasis ${test.expectedPrimaryArticle}, pero se obtuvo ${primaryLaw} ID:${debug.primaryBasisRef}`);
                    failed++;
                    continue;
                }
            }

            // 3. Priority Law Logic
            if (test.expectedPriorityLaw) {
                const primaryLaw = debug.primaryBasisLaw?.toUpperCase() || "";
                if (primaryLaw !== test.expectedPriorityLaw.toUpperCase()) {
                    console.warn(`  ⚠ WARN: primaryBasis law ${primaryLaw} no coincide con ley esperada ${test.expectedPriorityLaw}. Verificando supporting...`);
                    const supportingHaveLaw = debug.supportingBasisLaws?.some((law: string) => law.toUpperCase() === test.expectedPriorityLaw!.toUpperCase());
                    if (!supportingHaveLaw) {
                        console.error(`  ❌ FAIL: No se encontró la ley ${test.expectedPriorityLaw} ni en primary nor in supporting.`);
                        console.error(`          Primary: ${debug.primaryBasisLaw} (${debug.primaryBasisRef})`);
                        console.error(`          Supporting: ${debug.supportingBasisLaws?.join(", ")}`);
                        console.error(`          Intención detectada: ${debug.detectedIntent}`);
                        console.error(`          Ranking Applied: ${debug.authorityRankingApplied}`);
                        failed++;
                        continue;
                    }
                }
            }

            // 4. Pruning Logic
            const detailLimit = test.body.detailLevel === "sencilla" ? 1 : (test.body.detailLevel === "tecnica" ? 4 : 2);
            if (debug.supportingBasisRefs?.length > detailLimit) {
                console.error(`  ❌ FAIL: Demasiados artículos de apoyo (${debug.supportingBasisRefs.length}) para nivel ${test.body.detailLevel}. Límite: ${detailLimit}`);
                failed++;
                continue;
            }

            // 5. Response Contract (Phase 7B fields)
            if (!answer.primaryBasis || !answer.supportingBasis) {
                console.error("  ❌ FAIL: Respuesta JSON no contiene 'primaryBasis' o 'supportingBasis'");
                failed++;
                continue;
            }

            if (!answer.primaryBasis.ref || !answer.primaryBasis.whySelected) {
                console.error("  ❌ FAIL: 'primaryBasis' malformado");
                failed++;
                continue;
            }

            // 6. Fundamentar logic
            if (test.validateFundamentar) {
                const hasProcedure = answer.supportingBasis.some((b: any) => b.role === "procedure");
                if (!hasProcedure) {
                    console.error("  ❌ FAIL: El modo fundamentar debería incluir al menos un fundamento de rol 'procedure'");
                    failed++;
                    continue;
                }
            }

            console.log(`  ✅ PASS: Primary=${debug.primaryBasisRef} | Supporting=${debug.supportingBasisRefs?.length} | Rejected=${debug.rejectedBasisRefs?.length}`);
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

runAuthorityRankingTest();
