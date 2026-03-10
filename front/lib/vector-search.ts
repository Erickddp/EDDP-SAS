import { pool } from "./db";
import { generateEmbedding } from "./embedding";

export async function searchArticles(query: string, limit: number = 5) {
    const embedding = await generateEmbedding(query);
    const embeddingString = `[${embedding.join(',')}]`;

    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT a.id, a.article_number, a.title, a.text, d.name as document_name,
                   1 - (ae.embedding <=> $1::vector) AS similarity
            FROM articles a
            JOIN article_embeddings ae ON a.id = ae.article_id
            JOIN documents d ON a.document_id = d.id
            ORDER BY ae.embedding <=> $1::vector
            LIMIT $2
        `, [embeddingString, limit]);

        return result.rows;
    } finally {
        client.release();
    }
}
