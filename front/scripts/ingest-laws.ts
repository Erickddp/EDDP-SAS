/**
 * Unified Legal Ingestion Pipeline
 * 
 * Replaces old scripts (build-laws/load-laws/build-embeddings).
 * Features:
 * 1. Reads raw texts based on manifest.json
 * 2. Normalizes into structured articles with SHA-256 Hashes
 * 3. Verifies DB hashes: Skips unchanged articles to save API costs
 * 4. Generates Embeddings ONLY for modified/new articles
 * 5. Upserts cleanly to PostgreSQL taking advantage of `last_updated`.
 */

import "./load-env";
import fs from "fs";
import path from "path";
import { getClient } from "../lib/db";
import { generateEmbedding } from "../lib/embedding";
import { parseArticles, LawManifestEntry, NormalizedArticle } from "../lib/legal-ingestion";
import { parseArgs } from "util";

// Parse optional args to target specific docs (e.g., npm run ingest:laws -- --target=CFF)
const { values } = parseArgs({ args: process.argv.slice(2), options: { target: { type: 'string' } }, strict: false });
const targetLaw = values.target ? String(values.target).toUpperCase() : undefined;

const RAW_DIR = path.join(process.cwd(), 'data/legal/raw');
const MANIFEST_PATH = path.join(RAW_DIR, 'manifest.json');

async function run() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         MYFISCAL UNIFIED LEGAL INGESTION PIPELINE          ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
        process.exit(1);
    }

    const manifest: LawManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const client = await getClient();
    
    let stats = { totalDocs: 0, new: 0, updated: 0, skipped: 0, errors: 0 };

    try {
        for (const entry of manifest) {
            if (targetLaw && entry.abbreviation.toUpperCase() !== targetLaw) continue;

            console.log(`\n📄 Iniciando procesamiento: ${entry.abbreviation} - ${entry.documentName}`);
            const rawFilePath = path.join(RAW_DIR, entry.filename);
            
            if (!fs.existsSync(rawFilePath)) {
                console.warn(`  ⚠️ Archivo omitido (no encontrado): ${entry.filename}`);
                stats.errors++;
                continue;
            }

            // 1. Parse and Hash 
            const rawText = fs.readFileSync(rawFilePath, 'utf-8');
            const articles = parseArticles(entry.id, rawText);
            
            // Deduplicate articles strictly 
            const uniqueArticles = new Map<string, NormalizedArticle>();
            for (const art of articles) {
                if (!art.text) continue;
                const key = art.articleNumber;
                if (!uniqueArticles.has(key) || art.text.length > uniqueArticles.get(key)!.text.length) {
                    uniqueArticles.set(key, art);
                }
            }

            // 2. Diffing & Upsert
            console.log(`  🔍 ${uniqueArticles.size} artículos detectados y hasheados.`);
            
            for (const [artNum, art] of uniqueArticles) {
                try {
                    // Check DB for existing hash
                    const dbCheck = await client.query(`
                        SELECT id, content_hash FROM legal_documents 
                        WHERE abbreviation = $1 AND article_number = $2
                    `, [entry.abbreviation, artNum]);

                    const existing = dbCheck.rows[0];

                    if (existing && existing.content_hash === art.hash) {
                         // Unchanged
                         process.stdout.write(`.` ); // dot animation
                         stats.skipped++;
                         continue; 
                    }

                    // Modified or New -> Generate Embedding
                    console.log(`\n  ⚡ Cambios detectados en Art. ${artNum} -> Regenerando embedding...`);
                    const safeText = art.text.length > 15000 ? art.text.substring(0, 15000) + "..." : art.text;

                    const search_content = `Documento: ${entry.documentName}\nAbreviatura: ${entry.abbreviation}\nArtículo: ${art.articleNumber}\nContenido:\n${safeText}`.trim();

                    const embedding = await generateEmbedding(search_content);
                    const embeddingString = `[${embedding.join(',')}]`;

                    await client.query(`
                        INSERT INTO legal_documents (
                            document_name, abbreviation, article_number, title, content, search_content, sections, embedding, content_hash, last_updated
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                        ON CONFLICT (abbreviation, article_number) DO UPDATE SET
                            document_name = EXCLUDED.document_name,
                            title = EXCLUDED.title,
                            content = EXCLUDED.content,
                            search_content = EXCLUDED.search_content,
                            sections = EXCLUDED.sections,
                            embedding = EXCLUDED.embedding,
                            content_hash = EXCLUDED.content_hash,
                            last_updated = NOW()
                    `, [
                        entry.documentName,
                        entry.abbreviation,
                        art.articleNumber,
                        art.title || null,
                        art.text,
                        search_content,
                        JSON.stringify([]), // Not utilizing sections yet
                        embeddingString,
                        art.hash
                    ]);

                    if (existing) stats.updated++;
                    else stats.new++;

                } catch (artErr: any) {
                    console.error(`\n  ❌ Error upserting Art ${artNum}: ${artErr.message}`);
                    stats.errors++;
                }
            }
            stats.totalDocs++;
            console.log(`\n  ✅ Ley sincronizada: ${entry.abbreviation}`);
        }

        console.log(`\n══════════════════════════════════════════════════════════════`);
        console.log(`RESUMEN DE INGESTIÓN CORPORAL LEYES`);
        console.log(`Leyes procesadas:    ${stats.totalDocs}`);
        console.log(`Nuevos Artículos:    ${stats.new}`);
        console.log(`Artículos Modificados:${stats.updated}`);
        console.log(`Saltados (Sin Cambio):${stats.skipped}`);
        console.log(`Errores:             ${stats.errors}`);
        console.log(`══════════════════════════════════════════════════════════════\n`);

    } catch (err: any) {
        console.error("❌ Fallo crítico en pipeline:", err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();
