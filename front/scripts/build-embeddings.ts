import "./load-env";
import { getClient } from "../lib/db";
import { generateEmbedding } from "../lib/embedding";

// Función de espera para delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const client = await getClient();
  try {
    console.log(`🚀 Iniciando generación estructurada de embeddings para la tabla 'articles'...`);
    
    // 1. Idempotencia: Solo procesar los que no tengan embedding
    const { rows: articlesToProcess } = await client.query(`
      SELECT a.id, a.article_number, a.title, a.text, d.document_name, d.abbreviation
      FROM articles a
      JOIN documents d ON d.id = a.document_id
      WHERE a.embedding IS NULL
    `);

    const totalToProcess = articlesToProcess.length;

    if (totalToProcess === 0) {
      console.log("✅ Todos los artículos ya tienen vectores asignados o no hay artículos pendientes.");
      return;
    }

    console.log(`📂 Encontrados ${totalToProcess} artículos pendientes por ser vectorizados.`);

    let processedCount = 0;
    const batchSize = 100; // Procesamiento por lotes controlados
    const delayBetweenBatches = 2500; // 2.5 segundos de pausa entre lotes

    // Procesamiento en lotes
    for (let i = 0; i < totalToProcess; i += batchSize) {
      const batch = articlesToProcess.slice(i, i + batchSize);
      
      console.log(`\n⏳ Procesando lote ${Math.floor(i / batchSize) + 1} (${batch.length} artículos) [${processedCount}/${totalToProcess}]...`);

      for (const art of batch) {
        // Límite de seguridad para OpenAI para no pasarnos de tokens por request
        const safeText = art.text.length > 20000 ? art.text.substring(0, 20000) + "..." : art.text;
        const search_content = `Documento: ${art.document_name}\nAbreviatura: ${art.abbreviation}\nArtículo: ${art.article_number}\nContenido:\n${safeText}`.trim();

        let retries = 0;
        let success = false;
        
        // 2. Lógica de Reintento Exponencial (Retries & Backoff)
        while (!success && retries < 5) {
          try {
            const embedding = await generateEmbedding(search_content);
            const embeddingString = `[${embedding.join(',')}]`;

            // Actualizar la fila individual de manera atómica
            await client.query(`
              UPDATE articles 
              SET embedding = $1::vector
              WHERE id = $2
            `, [embeddingString, art.id]);
            
            success = true;
            processedCount++;
            
            // 3. Trazabilidad: Progreso secuencial silenciado para no saturar terminal
            if (processedCount % 10 === 0) {
                process.stdout.write(`.` ); 
            }
          } catch (embedError: any) {
             const status = embedError.status || embedError.response?.status;
             
             if (status === 429 || embedError.message?.includes('429')) {
                // Exponential Backoff (5s, 10s, 20s, 40s...)
                const backoffDelay = Math.pow(2, retries) * 5000;
                console.warn(`\n    ⚠️ Rate Limit (429 API) alcanzado en Art. ${art.article_number}. Reintentando en ${backoffDelay/1000}s (Intento ${retries + 1}/5)...`);
                await sleep(backoffDelay);
                retries++;
             } else {
                console.error(`\n    ❌ Fallo crítico en [${art.abbreviation}] Art. ${art.article_number}: ${embedError.message}`);
                break; // Skip a unhandled exception to not loop forever
             }
          }
        }
      }

      console.log(`\n✅ Lote completado. Progreso actual: [${processedCount}/${totalToProcess}] Embeddings inyectados.`);
      
      if (i + batchSize < totalToProcess) {
        console.log(`⏱️ Ejecutando Delay: Esperando ${delayBetweenBatches/1000}s para evitar la saturación en tokens temporales...`);
        await sleep(delayBetweenBatches);
      }
    }
    
    console.log(`\n🚀 Generación Vectorial Terminada. Total insertados a PG: ${processedCount}/${totalToProcess}`);
  } catch (err) {
    console.error("❌ Error General del Pipeline:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
