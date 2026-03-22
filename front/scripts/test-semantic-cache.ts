
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const API_URL = "http://localhost:3000/api/chat";
const TESTER_UUID = "f40076a0-e349-4b7e-9b5c-a6a0f3788cf4";

async function testCache() {
    const query = "¿Cuál es la tasa de IVA en la frontera?";
    const profile = "entrepreneur";

    console.log(`🚀 [CACHE TEST] Ejecutando prueba de caché semántico para: "${query}"`);

    try {
        // 1. First call (should be a cache miss)
        console.log("\n1️⃣  Primera llamada (Miss esperado)...");
        const start1 = Date.now();
        const res1 = await axios.post(API_URL, {
            message: query,
            userId: TESTER_UUID,
            conversationId: `test-cache-${Date.now()}`,
            mode: "profesional",
            detailLevel: "sencilla"
        }, {
            headers: { "x-test-bypass": process.env.SESSION_SECRET }
        });
        const duration1 = Date.now() - start1;
        console.log(`✅ Recibido en ${duration1}ms. CacheHit: ${res1.data._debug?.cacheHit || false}`);

        // Wait a bit for Redis persistence
        await new Promise(r => setTimeout(r, 1000));

        // 2. Second call (should be a cache hit)
        console.log("\n2️⃣  Segunda llamada (Hit esperado)...");
        const start2 = Date.now();
        const res2 = await axios.post(API_URL, {
            message: query,
            userId: TESTER_UUID,
            conversationId: `test-cache-${Date.now() + 1}`,
            mode: "profesional",
            detailLevel: "sencilla"
        }, {
            headers: { "x-test-bypass": process.env.SESSION_SECRET }
        });
        const duration2 = Date.now() - start2;
        console.log(`🚀 Recibido en ${duration2}ms. CacheHit: ${res2.data._debug?.cacheHit || false}`);

        if (res2.data._debug?.cacheHit) {
            console.log("\n🏆 [SUCCESS] El Caché Semántico está funcionando correctamente.");
            console.log(`📉 Reducción de tiempo: ${Math.round((1 - duration2/duration1) * 100)}%`);
        } else {
            console.log("\n⚠️ [WARNING] No se detectó CacheHit en la segunda llamada.");
        }

    } catch (e: any) {
        console.error("❌ Error en la prueba:", e.response?.data || e.message);
    }
}

testCache();
