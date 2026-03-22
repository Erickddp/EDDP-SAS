
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const API_URL = "http://localhost:3000/api/chat";
const SESSION_SECRET = process.env.SESSION_SECRET;

async function runStressTest() {
    console.log("🚀 Iniciando Prueba de Estrés: Rate Limiting (5 req/min)");
    
    const requests = Array.from({ length: 7 }).map((_, i) => {
        return axios.post(API_URL, {
            message: `Pregunta de estrés ${i + 1}`,
            conversationId: `stress-test-${Date.now()}`,
            mode: "profesional",
            detailLevel: "sencilla"
        }, {
            headers: { "x-test-bypass": SESSION_SECRET },
            validateStatus: () => true // Don't throw on 429
        });
    });

    console.log("📡 Enviando 7 peticiones simultáneas...");
    const results = await Promise.all(requests);

    results.forEach((res, i) => {
        const status = res.status === 429 ? "❌ 429 REJECTED" : `✅ ${res.status} OK`;
        console.log(`Petición ${i + 1}: ${status}`);
    });

    const rejectCount = results.filter(r => r.status === 429).length;
    if (rejectCount > 0) {
        console.log(`\n🏆 [SUCCESS] El Rate Limiting bloqueó ${rejectCount} ataques.`);
    } else {
        console.log("\n⚠️ [FAILURE] El Rate Limiting no se activó. Revisa la conexión a Redis.");
    }
}

runStressTest();
