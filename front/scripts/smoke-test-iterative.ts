
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { SignJWT, JWTPayload } from "jose";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_URL = "http://localhost:3000/api/chat";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-key-change-me";

async function generateMockSession(): Promise<string> {
    const encoder = new TextEncoder();
    const encodedKey = encoder.encode(SESSION_SECRET);
    
    // Generar un UUID válido para el tester
    const validUuid = "f40076a0-e349-4b7e-9b5c-a6a0f3788cf4";
    
    const payload: JWTPayload = {
        id: validUuid,
        email: "tester@sasfiscal.com",
        name: "Smoke Tester",
        role: "admin",
        plan: "pro",
        subscriptionStatus: "active"
    };

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(encodedKey);
}

async function smokeTestIterativeRAG() {
    console.log("🚀 [SMOKE TEST] Validando RAG Iterativo en Endpoint de Producción...");
    
    const mockToken = await generateMockSession();
    
    // CASO COMPLEJO: Requiere cruce de LISR y LIVA
    const complexQuery = "Diferencias en las obligaciones de retención de ISR e IVA cuando una persona física RESICO le factura a una persona moral";
    
    console.log(`🔍 Enviando consulta compleja: "${complexQuery}"`);
    console.log("------------------------------------------------------------");

    try {
        const response = await axios.post(API_URL, {
            message: complexQuery,
            conversationId: "smoke-test-phase-6-" + Date.now(),
            mode: "profesional",
            detailLevel: "tecnica",
            history: []
        }, {
            timeout: 60000, // Aumentado a 60s
            headers: {
                Cookie: `session=${mockToken}`
            }
        });

        const { answer, _debug } = response.data;

        console.log("✅ Respuesta recibida con éxito.");
        console.log(`│ Estrategia de Recuperación: ${_debug.retrievalStrategy}`);
        console.log(`│ Fue Iterativo: ${_debug.wasIterative}`);
        console.log(`│ Pases Realizados: ${_debug.passCount}`);
        console.log(`│ Tokens Iteración Est.: ${_debug.iterativeTokens}`);
        console.log(`│ Artículos Totales: ${_debug.retrievedArticlesCount}`);
        
        console.log("\n📄 Resumen de la Respuesta:");
        console.log(answer.summary.substring(0, 300) + "...");
        
        console.log("\n⚖️  Fundamentación Base:");
        if (answer.citations && answer.citations.length > 0) {
            console.table(answer.citations.map((c: any) => ({
                Ref: c.ref,
                Tipo: c.type,
                Ley: c.law
            })));
        } else {
            console.log("⚠️ No se incluyeron citas explícitas.");
        }

        if (_debug.wasIterative) {
            console.log("\n🏆 [SUCCESS] El sistema detectó la complejidad y ejecutó el motor multi-paso.");
        } else {
            console.warn("\n⚠️ [WARNING] El sistema usó RAG lineal.");
            console.log("Análisis de Intención:", response.data.queryAnalysis.complexity);
        }

    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error("❌ ERROR: El servidor local no está corriendo en el puerto 3000.");
        } else {
            const errData = error.response?.data;
            if (errData?.details?.includes("uuid")) {
                console.error("❌ ERROR DE UUID: El sistema intentó validar al usuario en la DB pero el ID era inválido o inexistente.");
            } else {
                console.error("❌ ERROR EN EL TEST:", errData || error.message);
            }
        }
    } finally {
        process.exit(0);
    }
}

smokeTestIterativeRAG();
