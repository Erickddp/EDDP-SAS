import { getClient } from "../lib/db";
import { generateEmbedding } from "../lib/embedding";
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function debugSearch() {
  const client = await getClient();
  try {
    const query = "que dice el articulo 1 cpeum";
    const embedding = await generateEmbedding(query);
    const embeddingString = `[${embedding.join(',')}]`;

    console.log("Query Embedding generated.");

    const res = await client.query(`
      SELECT 
        l.abbreviation, 
        l.article_number, 
        (1 - (l.embedding <=> $1::vector)) as raw_sim
      FROM legal_documents l
      ORDER BY raw_sim DESC
      LIMIT 10
    `, [embeddingString]);

    console.log("Raw similarities (Top 10):");
    console.table(res.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

debugSearch();
