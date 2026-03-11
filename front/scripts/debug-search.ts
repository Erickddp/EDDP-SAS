import "./load-env";
import { getClient } from "../lib/db";
import { generateEmbedding } from "../lib/embedding";

async function debugSearch() {
  const client = await getClient();
  try {
    const queries = ["art 1 cpeum", "art 100 lisr"];
    
    for (const query of queries) {
      console.log(`\n--- Debugging Query: "${query}" ---`);
      const embedding = await generateEmbedding(query);
      const embeddingString = `[${embedding.join(',')}]`;

      // Similitud específica con el artículo esperado
      const abbrev = query.includes("cpeum") ? "CPEUM" : "LISR";
      const artNum = query.includes("cpeum") ? "1o" : "100";

      const specificRes = await client.query(`
        SELECT 
          l.abbreviation, 
          l.article_number, 
          (1 - (l.embedding <=> $1::vector)) as raw_sim
        FROM legal_documents l
        WHERE l.abbreviation = $2 AND l.article_number = $3
      `, [embeddingString, abbrev, artNum]);

      console.log(`Similarity with EXACT article (${abbrev} Art. ${artNum}):`);
      console.table(specificRes.rows);

      const res = await client.query(`
        SELECT 
          l.abbreviation, 
          l.article_number, 
          (1 - (l.embedding <=> $1::vector)) as raw_sim
        FROM legal_documents l
        ORDER BY raw_sim DESC
        LIMIT 5
      `, [embeddingString]);

      console.log(`Top 5 general similarities:`);
      console.table(res.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

debugSearch();
