import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * PRODUCTION DATABASE CONNECTION LAYER
 * Resolves ENOTFOUND issues by strictly using the native DATABASE_URL from Vercel/Environment.
 * Direct connection without manual URL building or HTTP malformed prefixes.
 * NOTA: Aquí EXPRESAMENTE usamos DATABASE_URL (Pooler) y NO DIRECT_URL para evitar
 * agotar las conexiones en entorno Serverless. Los scripts usan DIRECT_URL.
 */

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl && process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: DATABASE_URL is missing in Production environment.');
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  // Vercel Serverless Optimization (Reduced pool size for concurrency handling)
  max: 4, 
  min: 0,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
});

/**
 * Standard query wrapper for type safety and unified error logging.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV !== 'production' && duration > 500) {
      console.warn(`🐢 Slow Query (${duration}ms):`, text.substring(0, 100));
    }
    
    return res;
  } catch (error: any) {
    console.error('❌ Database Query Failure:', {
      message: error.message,
      code: error.code,
      host: dbUrl ? new URL(dbUrl).hostname : 'undefined',
      detail: error.detail,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions.
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
