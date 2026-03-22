import { NextResponse } from "next/server";

export const maxDuration = 60; // Max time for LLM parsing and vectorization
import { parseLegalText, ExtractionResultSchema } from "@/lib/admin/document-parser";
import { getSession } from "@/lib/session";
import { getClient } from "@/lib/db";
import { generateEmbedding } from "@/lib/embedding";

/**
 * POST /api/admin/ingest
 * Ingests, parses, persists and vectorizes legal text.
 */
export async function POST(req: Request) {
    try {
        const { text, lawName, lawAbbr, dryRun } = await req.json();

        // 1. RBAC Security
        const session = await getSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!text || !lawAbbr || !lawName) {
             return NextResponse.json({ error: "Missing document metadata (text, lawName, lawAbbr)" }, { status: 400 });
        }

        console.log(`[INGEST] Starting for ${lawAbbr}...`);

        // 2. Transfrom: Text -> Structured JSON
        const result = await parseLegalText(text);
        const validation = ExtractionResultSchema.safeParse(result);
        if (!validation.success) {
            return NextResponse.json({ error: "Parser validation failed", details: validation.error }, { status: 500 });
        }

        if (dryRun) {
            return NextResponse.json({ status: "dry-run", data: result });
        }

        // 3. Persist SQL (UPSERT)
        const client = await getClient();
        let articlesProcessed = 0;
        let embeddingsGenerated = 0;

        try {
            await client.query("BEGIN");

            // --- A. Sync Document ---
            const docId = lawAbbr.toLowerCase().trim();
            await client.query(`
                INSERT INTO documents (id, document_name, abbreviation, filename, source, status)
                VALUES ($1, $2, $3, $4, $5, 'vigente')
                ON CONFLICT (id) DO UPDATE SET document_name = EXCLUDED.document_name, abbreviation = EXCLUDED.abbreviation
            `, [docId, lawName, lawAbbr, `${docId}.txt`, "Manual Ingest"]);

            // --- B. Sync Articles ---
            for (const art of result.articles) {
                const artId = `${docId}-${art.articleNumber.replace(/\s+/g, '-').toLowerCase()}`;
                
                // Check if text changed or embedding is missing
                const { rows: existing } = await client.query(
                    "SELECT text, embedding FROM articles WHERE id = $1", 
                    [artId]
                );

                const needsEmbedding = !existing[0] || existing[0].text !== art.content || !existing[0].embedding;

                let embeddingVectorStr: string | null = null;
                if (needsEmbedding) {
                    console.log(`[INGEST] Vectorizing Art. ${art.articleNumber}...`);
                    const vector = await generateEmbedding(art.content);
                    embeddingVectorStr = `[${vector.join(",")}]`;
                    embeddingsGenerated++;
                }

                await client.query(`
                    INSERT INTO articles (id, document_id, article_number, title, text, embedding)
                    VALUES ($1, $2, $3, $4, $5, $6::vector)
                    ON CONFLICT (id) DO UPDATE SET 
                        title = EXCLUDED.title,
                        text = EXCLUDED.text,
                        embedding = CASE WHEN EXCLUDED.embedding IS NOT NULL THEN EXCLUDED.embedding ELSE articles.embedding END
                `, [artId, docId, art.articleNumber, art.title || null, art.content, embeddingVectorStr]);
                
                articlesProcessed++;
            }

            await client.query("COMMIT");

            return NextResponse.json({
                status: "success",
                document: lawAbbr,
                articlesProcessed,
                embeddingsGenerated,
                message: `Ingested ${articlesProcessed} articles. Generated ${embeddingsGenerated} new vectors.`
            });

        } catch (dbErr: any) {
            await client.query("ROLLBACK");
            throw dbErr;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error("[INGEST API ERROR]:", error);
        return NextResponse.json({ error: "Ingestion failed", detail: error.message }, { status: 500 });
    }
}
