
import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function upgradeArticlesTable() {
    console.log("🛠️  Iniciando actualización de la tabla 'articles'...");
    
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ Error: DIRECT_URL o DATABASE_URL no está definida en .env");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Conexión establecida.");

        // 1. Crear extensión si no existe
        console.log("📦 Habilitando extensión 'vector'...");
        await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
        
        // 2. Agregar columna embedding a la tabla principal
        console.log("🧬 Agregando columna 'embedding' (vector 1536)...");
        await client.query(`
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS embedding vector(1536);
        `);

        // 3. Crear índice HNSW para búsqueda rápida
        console.log("⚡ Creando índice HNSW para búsqueda semántica...");
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_articles_embedding_hnsw 
            ON articles USING hnsw (embedding vector_cosine_ops);
        `);

        console.log("🏆 [SCHEMA UPDATE SUCCESS] Tabla 'articles' lista para RAG Vectorial.");
    } catch (err: any) {
        console.error("❌ Error actualizando schema:", err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

upgradeArticlesTable();
