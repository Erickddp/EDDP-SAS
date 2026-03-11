import "./load-env";
import { getClient } from '../lib/db';

async function updateSchema() {
  const client = await getClient();
  try {
    console.log("Creando vector extension...");
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    console.log("Creando legal_documents...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        document_name TEXT NOT NULL,
        abbreviation TEXT NOT NULL,
        article_number TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        search_content TEXT NOT NULL,
        sections JSONB,
        embedding vector(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(abbreviation, article_number)
      );
    `);

    // HNSW index optionally (can skip for now or create manually)

    console.log("Creando search_legal_hybrid RPC...");
    await client.query(`
      CREATE OR REPLACE FUNCTION search_legal_hybrid(
        query_embedding vector(1536),
        match_count int,
        filter_abbrev text,
        filter_art text
      )
      RETURNS TABLE (
        id uuid,
        abbreviation text,
        article_number text,
        content text,
        sections jsonb,
        similarity float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          l.id, l.abbreviation, l.article_number, l.content, l.sections,
          -- Cálculo de similitud base + BOOSTING jerárquico
          (1 - (l.embedding <=> query_embedding)) 
          + CASE WHEN filter_abbrev IS NOT NULL AND l.abbreviation = filter_abbrev THEN 0.40 ELSE 0 END
          + CASE 
              WHEN filter_art IS NOT NULL AND (
                l.article_number = filter_art OR 
                l.article_number = filter_art || 'o' OR
                replace(l.article_number, 'o', '') = filter_art
              ) THEN 0.50 
              ELSE 0 
            END
          AS similarity
        FROM legal_documents l
        -- Threshold base más bajo para permitir mayor recall semántico
        WHERE (1 - (l.embedding <=> query_embedding)) > 0.25
        ORDER BY similarity DESC
        LIMIT match_count;
      END;
      $$;
    `);

    console.log("✅ Tablas schema actualizadas con éxito.");
  } catch (err) {
    console.error("Error updates:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateSchema();
