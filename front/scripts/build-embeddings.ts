import "./load-env";
import { getClient } from "../lib/db";
import { generateEmbedding } from "../lib/embedding";
import fs from "fs";
import path from "path";
import { parseArgs } from 'util';

const { values } = parseArgs({ args: process.argv.slice(2), options: { target: { type: 'string' } }, strict: false });
const target = values.target ? String(values.target).toUpperCase() : undefined;

async function run() {
  const client = await getClient();
  try {
    console.log(`🚀 Iniciando generación de embeddings para tabla 'articles'...`);
    
    // Fetch articles that don't have embeddings yet
    const { rows: articlesToProcess } = await client.query(`
      SELECT a.id, a.article_number, a.title, a.text, d.document_name, d.abbreviation
      FROM articles a
      JOIN documents d ON d.id = a.document_id
      WHERE a.embedding IS NULL
      ${target ? 'AND d.abbreviation = $1' : ''}
    `, target ? [target] : []);

    if (articlesToProcess.length === 0) {
      console.log("✅ Todos los artículos ya tienen embeddings o no hay artículos para procesar.");
      return;
    }

    console.log(`📂 Encontrados ${articlesToProcess.length} artículos sin embedding.`);

    for (const art of articlesToProcess) {
      const safeText = art.text.length > 15000 ? art.text.substring(0, 15000) + "..." : art.text;
      
      const search_content = `
Documento: ${art.document_name}
Abreviatura: ${art.abbreviation}
Artículo: ${art.article_number}
Contenido:
${safeText}
      `.trim();

      console.log(`    [${art.abbreviation}] Generando embedding para Art. ${art.article_number}...`);
      
      try {
        const embedding = await generateEmbedding(search_content);
        const embeddingString = `[${embedding.join(',')}]`;

        await client.query(`
          UPDATE articles 
          SET embedding = $1::vector
          WHERE id = $2
        `, [embeddingString, art.id]);
        
      } catch (embedError: any) {
        console.error(`    ❌ Fallo en Art. ${art.article_number}: ${embedError.message}`);
      }
    }
    
    console.log(`\n🚀 Generación de embeddings finalizada.`);
  } catch (err) {
    console.error("❌ Error en Ingestión:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
