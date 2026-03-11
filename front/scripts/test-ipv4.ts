import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
  if (!connectionString) return;

  const url = new URL(connectionString);
  console.log(`🔍 Resolving ${url.hostname}...`);
  
  try {
    const { address } = await lookup(url.hostname, { family: 4 });
    console.log(`✅ IPv4 Address: ${address}`);
    
    const config = {
      user: url.username,
      password: decodeURIComponent(url.password),
      host: address, // Connect to IP directly
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false }
    };

    console.log(`🔌 Attempting connection to ${address}:${config.port}...`);
    const pool = new Pool(config);
    const start = Date.now();
    const res = await pool.query('SELECT NOW()');
    console.log(`✅ Success in ${Date.now() - start}ms!`);
    await pool.end();
  } catch (err: any) {
    console.error(`❌ Connection failed: ${err.message}`);
  }
}

testConnection();
