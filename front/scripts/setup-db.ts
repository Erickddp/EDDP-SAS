import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL not found in .env');
  process.exit(1);
}

// Log connection attempt (masked)
const maskedUrl = connectionString.replace(/:.+@/, ":***@");
console.log(`🔌 Conectando a: ${maskedUrl}`);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  connectionTimeoutMillis: 15000,
  keepAlive: true,
});

async function setupDb() {
  const schemaPath = path.join(process.cwd(), 'scripts/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('🚀 Setting up database schema...');
  try {
    console.log('⏳ Probando conexión al pool...');
    const client = await pool.connect();
    console.log('✅ Conexión establecida.');
    
    console.log('⏳ Ejecutando schema.sql...');
    await client.query(schemaSql);
    console.log('✅ Schema aplicado correctamente.');
    client.release();
  } catch (error: any) {
    console.error('❌ Error applying schema:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDb();
