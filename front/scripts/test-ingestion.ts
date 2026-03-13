/**
 * Validation Script for Legal Ingestion Engine
 * Run: npm run test:ingestion
 */

import "./load-env";
import { parseArticles, generateContentHash } from "../lib/legal-ingestion";

async function runTest() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         VALIDANDO INGESTION LEGAL & HASHING                ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const mockDocumentId = "test-doc-01";
    
    // Simular un texto bruto típico
    const mockRawText = `
LEY MOCK
TEXTO INICIAL QUE DEBE SER IGNORADO

Artículo 1. Título del Artículo Uno.
Este es el contenido del primer artículo.
Debe ser capturado correctamente.

Artículo 2.-
Este es el segundo artículo.
Párrafo extra del segundo.

ARTÍCULO 3o. Obligaciones.
Tercer artículo con ordinal.
`;

    console.log("═══ TEST 1: Extracción y Limpieza ═══");
    const articles = parseArticles(mockDocumentId, mockRawText);
    
    if (articles.length === 3) {
        console.log("  ✅ Se detectaron correctamente 3 artículos.");
    } else {
        console.error(`  ❌ Fallo. Se detectaron ${articles.length} artículos (esperados: 3)`);
        process.exit(1);
    }

    if (articles[0].articleNumber === "1" && articles[0].title === "Título del Artículo Uno.") {
         console.log("  ✅ Extracción de Título y Número exitosa.");
    } else {
         console.error("  ❌ Fallo en extracción de título o número.", articles[0]);
         process.exit(1);
    }

    if (articles[2].articleNumber === "3o" && articles[2].title === "Obligaciones.") {
         console.log("  ✅ Extracción de Ordinales exitosa.");
    } else {
         console.error("  ❌ Fallo en extracción de ordinales.", articles[2]);
         process.exit(1);
    }
    
    console.log("");

    console.log("═══ TEST 2: Hashing y Consistencia ═══");
    const hash1 = articles[0].hash;
    const hash2 = generateContentHash(articles[0].text);
    
    if (hash1 === hash2 && hash1 && hash1.length === 64) {
         console.log("  ✅ Hash SHA-256 generado consistentemente.");
    } else {
         console.error("  ❌ Inconsistencia en generación de hash.");
         process.exit(1);
    }

    const modifiedText = articles[0].text + " (Reformado)";
    const hash3 = generateContentHash(modifiedText);

    if (hash1 !== hash3) {
         console.log("  ✅ Hash muta correctamente ante cambios sutiles.");
    } else {
         console.error("  ❌ El hash no cambió ante un texto modificado.");
         process.exit(1);
    }

    console.log("\n══════════════════════════════════════════════════════════════");
    console.log("RESULTS: ALL INGESTION LOGIC TESTS PASSED ✅");
    console.log("══════════════════════════════════════════════════════════════");
    process.exit(0);
}

runTest().catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
});
