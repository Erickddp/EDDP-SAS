import "./load-env";
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  keepAlive: true,
});

async function setupDb() {
  const schemaPath = path.join(process.cwd(), 'scripts/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('🚀 Setting up database schema...');
  try {
    const client = await pool.connect();
    console.log('✅ Conexión establecida.');
    
    await client.query(schemaSql);
    console.log('✅ Schema aplicado correctamente.');
    client.release();
  } catch (error: any) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDb();
