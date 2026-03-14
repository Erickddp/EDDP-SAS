import { Pool, QueryResult, QueryResultRow } from 'pg';
import { CONFIG } from './env-config';

const connectionString = CONFIG.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL not found in environment variables. Database features will be unavailable.');
}

const pool = new Pool({
  connectionString,
  // Enforce SSL for Supabase compatibility
  ssl: {
    rejectUnauthorized: false
  },
  // Supabase/Serverless best practices
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10,
  keepAlive: true,
});

/**
 * Execute a SQL query
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (error: any) {
    // Structured logging for debugging without revealing credentials
    console.error('❌ Database Query Error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
