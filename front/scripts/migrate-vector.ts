import "./load-env";
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  if (!connectionString) {
    console.error("❌ DIRECT_URL or DATABASE_URL missing");
    return;
  }
  const client = await pool.connect();
  try {
    console.log('Ensuring vector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    console.log('Adding embedding column to articles...');
    await client.query('ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding vector(1536);');
    
    console.log('Creating HNSW index...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_articles_embedding ON articles USING hnsw (embedding vector_cosine_ops);');
    
    console.log('✅ Migration successful.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
