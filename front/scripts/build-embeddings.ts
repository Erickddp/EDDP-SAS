import { initDb, pool } from "../lib/db";
import { generateEmbedding } from "../lib/embedding";
import { ALL_LAW_ARTICLES, LAW_DOCUMENTS } from "../lib/laws/index";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Initializing database...");
    await initDb();

    // Ensure normalized output directory exists
    const normalizedDir = path.join(process.cwd(), "data", "legal", "normalized");
    if (!fs.existsSync(normalizedDir)) {
        fs.mkdirSync(normalizedDir, { recursive: true });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        console.log("Saving normalized JSON files...");
        const documentsPath = path.join(normalizedDir, "documents.json");
        const articlesPath = path.join(normalizedDir, "articles.json");
        
        fs.writeFileSync(documentsPath, JSON.stringify(LAW_DOCUMENTS, null, 2));
        fs.writeFileSync(articlesPath, JSON.stringify(ALL_LAW_ARTICLES, null, 2));

        console.log("Reading normalized JSON files...");
        const docsData = JSON.parse(fs.readFileSync(documentsPath, "utf-8"));
        const articlesData = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));

        console.log(`Processing ${docsData.length} documents...`);
        for (const doc of docsData) {
            await client.query(`
                INSERT INTO documents (id, name, abbreviation, source, version)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING
            `, [doc.id, doc.name, doc.abbreviation, doc.source, doc.lastUpdate]);
            console.log(`Document inserted: ${doc.name}`);
        }

        console.log(`Processing ${articlesData.length} articles...`);
        for (const article of articlesData) {
            await client.query(`
                INSERT INTO articles (id, document_id, article_number, title, text)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE SET 
                    title = EXCLUDED.title,
                    text = EXCLUDED.text
            `, [article.id, article.documentId, article.articleNumber, article.title, article.text]);
            console.log(`Article inserted: ${article.id}`);

            // Check if embedding already exists
            const existingEmbedding = await client.query(
                `SELECT id FROM article_embeddings WHERE article_id = $1`,
                [article.id]
            );

            if (existingEmbedding.rows.length === 0) {
                console.log(`Generating embedding for article: ${article.id}`);
                const embedding = await generateEmbedding(article.text);
                const embeddingString = `[${embedding.join(',')}]`;

                await client.query(`
                    INSERT INTO article_embeddings (id, article_id, embedding)
                    VALUES ($1, $2, $3)
                `, [`${article.id}-emb`, article.id, embeddingString]);
                console.log(`Embedding generated and saved for article: ${article.id}`);
            } else {
                console.log(`Embedding already exists for article: ${article.id}`);
            }
        }

        await client.query("COMMIT");
        console.log("Pipeline executed successfully.");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("Error executing pipeline:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
