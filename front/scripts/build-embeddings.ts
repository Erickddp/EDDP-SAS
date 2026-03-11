import { getClient } from "../lib/db";
import { generateEmbedding } from "../lib/embedding";
import fs from "fs";
import path from "path";
import { parseArgs } from 'util';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

const { values } = parseArgs({ args: process.argv.slice(2), options: { target: { type: 'string' } }, strict: false });
const target = values.target ? String(values.target).toUpperCase() : undefined;

async function run() {
  const client = await getClient();
  try {
    const normalizedDir = path.join(process.cwd(), 'data/legal/normalized');
    
    if (!fs.existsSync(normalizedDir)) {
      console.error(`❌ Directorio no encontrado: ${normalizedDir}. Corre 'npm run build:laws' primero.`);
      return;
    }

    const files = fs.readdirSync(normalizedDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(normalizedDir, file);
      const contentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      const { document, articles } = contentData;
      
      if (target && document.abbreviation.toUpperCase() !== target) {
         continue; // skip if doesn't match target
      }

      console.log(`\n📄 Procesando Documento: ${document.abbreviation} - ${document.documentName}`);
      console.log(`[1] Limpiando PostgreSQL para ${document.abbreviation}...`);
      await client.query(`DELETE FROM legal_documents WHERE abbreviation = $1`, [document.abbreviation]);

      // Deduplicar artículos para evitar errores de clave única en la misma transacción
      const uniqueArticles = new Map();
      for (const art of articles) {
        if (!art.text) continue;
        const key = art.articleNumber;
        // Si ya existe, nos quedamos con el que tenga texto más largo (probablemente más completo)
        if (!uniqueArticles.has(key) || art.text.length > uniqueArticles.get(key).text.length) {
          uniqueArticles.set(key, art);
        }
      }

      console.log(`[2] Procesando Embeddings y PG Insert para ${uniqueArticles.size} artículos únicos (de ${articles.length})...`);
      for (const [artNum, art] of uniqueArticles) {
        // Truncar texto si es excesivamente largo para evitar error 400 de OpenAI
        // 8192 tokens es el límite. 15k chars es un límite muy seguro.
        const safeText = art.text.length > 15000 ? art.text.substring(0, 15000) + "..." : art.text;

        const search_content = `
Documento: ${document.documentName}
Abreviatura: ${document.abbreviation}
Artículo: ${art.articleNumber}
Contenido:
${safeText}
        `.trim();

        console.log(`    Generando embedding para Art. ${art.articleNumber} (${safeText.length} chars)...`);
        try {
          const embedding = await generateEmbedding(search_content);
          const embeddingString = `[${embedding.join(',')}]`;

          await client.query(`
            INSERT INTO legal_documents (
              document_name, abbreviation, article_number, title, content, search_content, sections, embedding
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (abbreviation, article_number) DO UPDATE SET
              document_name = EXCLUDED.document_name,
              title = EXCLUDED.title,
              content = EXCLUDED.content,
              search_content = EXCLUDED.search_content,
              sections = EXCLUDED.sections,
              embedding = EXCLUDED.embedding
          `, [
            document.documentName,
            document.abbreviation,
            art.articleNumber,
            art.title,
            art.text,
            search_content,
            JSON.stringify(art.sections || []),
            embeddingString
          ]);
        } catch (embedError: any) {
          console.error(`    ❌ Fallo en Art. ${art.articleNumber}: ${embedError.message}`);
          // Continuar con el siguiente para no romper todo el pipeline
        }
      }
      console.log(`✅ Embebido e insertado: ${document.abbreviation}`);
    }
    
    console.log(`\n🚀 Pipeline completo finalizado.`);
  } catch (err) {
    console.error("❌ Error en Ingestión:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
