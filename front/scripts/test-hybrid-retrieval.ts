import "./load-env";
import { searchPostgresArticles } from "../lib/pg-retrieval";
import { parseLegalReference } from "../lib/law-alias";

async function testQuery(query: string, limit: number = 3) {
    console.log(`\n🔍 BUSCANDO: "${query}" (limit=${limit})`);
    const parsedRef = parseLegalReference(query);
    const start = Date.now();
    const results = await searchPostgresArticles(query, limit, parsedRef);
    const end = Date.now();
    
    console.log(`⏱️ Tiempo: ${end - start}ms`);
    if (results.length === 0) {
        console.log("❌ No se encontraron resultados.");
        return;
    }

    results.forEach((r, i) => {
        console.log(`${i + 1}. [${r.documentAbbreviation}] Art. ${r.articleNumber}: ${r.title || "(Sin título)"}`);
        // console.log(`   Snippet: ${r.text.substring(0, 100)}...`);
    });
}

async function runTests() {
    console.log("=== PRUEBAS DE RETRIEVAL HÍBRIDO (FASE 3) ===");
    
    // 1. Exact Match
    await testQuery("artículo 27 LISR");
    
    // 2. Lexical
    await testQuery("deducciones autorizadas persona moral");
    
    // 3. Semantic / Vector
    await testQuery("cuándo se causa el IVA");
    
    // 4. Semantic Ambiguous
    await testQuery("qué pasa si pago mal mis impuestos");

    console.log("\n=== FIN DE PRUEBAS ===");
    process.exit(0);
}

runTests();
