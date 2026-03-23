import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('--- Verificación de Índice ---');
    
    // Check if index exists
    const indexCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'messages' AND indexname = 'conversation_id_idx';
    `);

    if (indexCheck.rows.length > 0) {
      console.log('✅ Índice [conversation_id_idx] está ACTIVO.');
    } else {
      console.log('❌ Índice NO encontrado.');
      return;
    }

    // Explain query to see if it uses the index
    console.log('\n--- Análisis de Consulta (EXPLAIN) ---');
    const explain = await client.query(`
      EXPLAIN SELECT * FROM messages WHERE conversation_id = 'test-id';
    `);
    
    const plan = explain.rows.map(r => r['QUERY PLAN']).join('\n');
    console.log(plan);
    
    if (plan.includes('Index Scan') || plan.includes('Bitmap Index Scan')) {
      console.log('\n✅ El plan de consulta UTILIZA el índice correctamente.');
    } else {
      console.log('\n⚠️ Precaución: El plan no está usando el índice (probablemente tabla vacía o muy pequeña).');
    }

  } catch (error) {
    console.error('Error en verificación:', error);
  } finally {
    await client.end();
  }
}

main();
