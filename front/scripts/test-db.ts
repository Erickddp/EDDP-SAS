import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
  if (!connectionString) return;

  const parts = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/(.+)/);
  if (!parts) return;

  const [_, user, password, host, portStr, database] = parts;
  const projectRef = host.split('.')[1] || host.split('.')[0];

  console.log(`🔍 Try specific Supabase Pooler username format: ${user}.${projectRef}`);

  const variations = [
    { name: 'Pooler with ProjectRef in User', config: { user: `${user}.${projectRef}`, password, host, port: 6543, database, ssl: { rejectUnauthorized: false } } },
    { name: 'Direct Port 6543 (Simple)', config: { user, password, host, port: 6543, database, ssl: { rejectUnauthorized: false } } },
  ];

  for (const variant of variations) {
    console.log(`\n--- Attempting: ${variant.name} ---`);
    const pool = new Pool(variant.config);
    try {
      const res = await pool.query('SELECT NOW()');
      console.log(`✅ Success!`);
      await pool.end();
      return;
    } catch (err: any) {
      console.error(`❌ Failed: ${err.message}`);
    } finally {
      await pool.end();
    }
  }
}

testConnection();
