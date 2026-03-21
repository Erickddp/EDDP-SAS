import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from "dotenv";
import path from "path";

// Support standard loading for scripts
dotenv.config(); // search current dir
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL not found (process.env.DATABASE_URL). Current CWD:', process.cwd());
}


const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10,
  keepAlive: true,
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    return res;
  } catch (error: any) {
    console.error('❌ Database Query Error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
