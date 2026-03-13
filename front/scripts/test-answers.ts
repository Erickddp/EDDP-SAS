/**
 * Validation Script for Phase 6A Answer Quality Layer
 * Run: npm run test:answers
 */

import "./load-env";
import { POST } from "../app/api/chat/route";
import { ChatRequest, ChatResponse } from "../lib/types";

async function runTestAnswers() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         VALIDANDO ANSWER QUALITY LAYER (Fase 6A)           ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const tests = [
        {
            id: "Simple",
            req: {
                conversationId: "test-answ-simple",
                message: "¿Cuál es el RFC?",
                mode: "casual",
                detailLevel: "sencilla"
            } as ChatRequest,
            validate: (res: ChatResponse) => {
                const errors = [];
                if (!res.answer.summary) errors.push("Falta summary.");
                if (res._debug?.summaryLength === 0) errors.push("Summary vacío.");
                if (!Array.isArray(res.answer.foundation)) errors.push("Foundation no es array.");
                if (res.answer.foundation.length > 0) {
                    const first = res.answer.foundation[0];
                    if (typeof first === "object" && !first.type) errors.push("FoundationObjects malformados.");
                }
                if (res.answer.explanation) errors.push("Existe explanation en modo simple (ilegal).");
                return errors;
            }
        },
        {
            id: "Detailed Multa",
            req: {
                conversationId: "test-answ-detailed",
                message: "¿Cuánto es la multa por no declarar impuestos a tiempo?",
                mode: "casual",
                detailLevel: "detallada"
            } as ChatRequest,
            validate: (res: ChatResponse) => {
                const errors = [];
                if (!res.answer.summary) errors.push("Falta summary.");
                if (!res.answer.explanation) errors.push("Falta explanation en modo detallado.");
                if (!res.answer.example) errors.push("Falta ejemplo a pesar de ser consulta de multa.");
                if (!Array.isArray(res.answer.foundation)) errors.push("Foundation no es array.");
                return errors;
            }
        },
        {
            id: "Technical",
            req: {
                conversationId: "test-answ-tech",
                message: "Explica el artículo 14 del CFF y sus correlacionados.",
                mode: "profesional",
                detailLevel: "tecnica"
            } as ChatRequest,
            validate: (res: ChatResponse) => {
                const errors = [];
                if (!res.answer.summary) errors.push("Falta summary.");
                if (!res.answer.explanation) errors.push("Falta explanation.");
                if (!res.answer.relatedArticles) errors.push("Faltan relatedArticles en technical.");
                if (!res.answer.legalInterpretation) errors.push("Falta legalInterpretation en technical.");
                return errors;
            }
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const t of tests) {
        console.log(`\n▶ TEST: ${t.id} ...\n  Pregunta: "${t.req.message}"`);
        try {
            const reqUrl = new Request("http://localhost:3000/api/chat", {
                method: "POST",
                body: JSON.stringify(t.req)
            });

            const rawRes = await POST(reqUrl);
            const resData: ChatResponse = await rawRes.json();

            const errors = t.validate(resData);
            
            console.log(`  Respuesta JSON Keys: ${resData._debug?.responseSections?.join(", ")}`);

            if (errors.length === 0) {
                console.log(`  ✅ PASS`);
                passed++;
            } else {
                console.error(`  ❌ FAIL: ${errors.join(" | ")}`);
                failed++;
            }
        } catch (e: any) {
            console.error(`  ❌ CRITICAL FAIL: ${e.message}`);
            failed++;
        }
    }

    console.log(`\n══════════════════════════════════════════════════════════════`);
    console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`══════════════════════════════════════════════════════════════\n`);
    
    if (failed > 0) process.exit(1);
    process.exit(0);
}

runTestAnswers();
