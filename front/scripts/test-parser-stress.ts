
import { parseLegalText } from "../lib/admin/document-parser";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const COMPLEX_LEGAL_TEXT = `
TÍTULO PRIMERO
De las Disposiciones Generales

Capítulo I

Artículo 27. Las personas morales así como las personas físicas que deban presentar declaraciones periódicas o que estén obligadas a expedir comprobantes fiscales digitales por Internet por los actos o actividades que realicen o por los ingresos que perciban, deberán solicitar su inscripción en el registro federal de contribuyentes.

(Derogado).

Artículo 28. Las personas que de acuerdo con las disposiciones fiscales estén obligadas a llevar contabilidad, estarán a lo siguiente:

I. La contabilidad, para efectos fiscales, se integra por:
a) Los libros, sistemas y registros contables.
b) Los papeles de trabajo.
c) Los estados de cuenta.

II. Los registros o asientos contables a que se refiere la fracción anterior deberán cumplir con los requisitos que establezca el Reglamento de este Código.

Artículo 29. (Reformado mediante decreto publicado el 12 de noviembre de 2021). Cuando las leyes fiscales establezcan la obligación de expedir comprobantes fiscales por los actos o actividades que realicen, por los ingresos que perciban o por las retenciones de contribuciones que efectúen, los contribuyentes deberán emitirlos mediante documentos digitales a través de la página de Internet del Servicio de Administración Tributaria.
`;

async function testExtractionStress() {
    console.log("🚀 [STRESS TEST] Iniciando extracción de texto legal complejo...");
    console.log("------------------------------------------------------------");

    try {
        const result = await parseLegalText(COMPLEX_LEGAL_TEXT);

        console.log(`✅ Extracción completada. Artículos detectados: ${result.articles.length}`);
        console.log("------------------------------------------------------------");

        result.articles.forEach((art, index) => {
            console.log(`\n📦 ARTÍCULO [${index + 1}]: ${art.articleNumber}`);
            console.log(`   🔹 Status: ${art.status}`);
            console.log(`   🔹 Jerarquía: ${art.hierarchy.titulo} > ${art.hierarchy.capitulo}`);
            console.log(`   🔹 Resumen: ${art.summary}`);
            console.log(`   🔹 Contenido (Primeros 100 char): ${art.content.substring(0, 100)}...`);
        });

        if (result.articles.some(a => a.status === "Derogado")) {
            console.log("\n🎯 TEST PASSED: El parser detectó correctamente artículos derogados.");
        }

        if (result.articles.some(a => a.content.includes("I. La contabilidad"))) {
            console.log("🎯 TEST PASSED: El parser preservó la estructura de fracciones e incisos.");
        }

    } catch (error: any) {
        console.error("❌ [STRESS TEST FAILED]:", error.message);
    }
}

testExtractionStress();
