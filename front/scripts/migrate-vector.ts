import * as dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Ensuring vector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    console.log('Adding embedding column to articles...');
    await client.query('ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding vector(1536);');
    
    console.log('Creating HNSW index...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_articles_embedding ON articles USING hnsw (embedding vector_cosine_ops);');
    
    console.log('✅ Migration successful.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
