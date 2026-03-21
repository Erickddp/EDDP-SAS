
import { decomposeQuery, evaluateSufficiency, performIterativeRetrieval } from "../lib/retrieval/iterative-engine";

async function testIterativeRetrieval() {
    const complexQuery = "¿Cuáles son las multas si no pago el IVA en el plazo legal establecido?";
    
    console.log("🚀 [STRESS TEST] Probando RAG Iterativo (Multipaso)...");
    console.log(`🔍 Query: "${complexQuery}"`);
    console.log("------------------------------------------------------------");

    try {
        // 1. Test Query Decomposition
        console.log("🛠️  Paso 1: Probando Query Decomposer...");
        const decomposition = await decomposeQuery(complexQuery);
        console.log("✅ Decomposition OK:");
        decomposition.tasks.forEach((t, i) => {
            console.log(`   [${i+1}] Query: ${t.query} (Law: ${t.targetLaw}, Priority: ${t.priority})`);
        });

        // 2. Test Sufficiency
        console.log("\n🛠️  Paso 2: Probando Sufficiency Analyzer...");
        const sufficiency = await evaluateSufficiency(complexQuery, []);
        console.log(`✅ Sufficiency Check Done.`);

        // 3. Test Full Orchestration
        console.log("\n🛠️  Paso 3: Ejecutando Orquestación Completa...");
        const result = await performIterativeRetrieval(complexQuery);
        console.log(`✅ Orquestación exitosa (${result.passCount} pases).`);
        console.log(`📦 Artículos recuperados: ${result.articles.length}`);
        
    } catch (error: any) {
        console.error("❌ [STRESS TEST FAILED]:", error.message);
    } finally {
        process.exit(0);
    }
}

testIterativeRetrieval();
