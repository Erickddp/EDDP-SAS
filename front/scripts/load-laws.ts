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
});

async function loadLaws() {
  const normalizedDir = path.join(process.cwd(), 'data/legal/normalized');
  
  if (!fs.existsSync(normalizedDir)) {
    console.error(`❌ Error: Directory not found: ${normalizedDir}`);
    return;
  }

  const files = fs.readdirSync(normalizedDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('⚠️ No normalized JSON files found to load.');
    return;
  }

  console.log(`📂 Encontrados ${files.length} archivos JSON para cargar.\n`);
  console.log('🚀 Iniciando carga legal...\n');
  
  let totalDocs = 0;
  let totalArticles = 0;

  for (const file of files) {
    const filePath = path.join(normalizedDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const { document, articles } = content;
    
    // Use a single client for transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Upsert Document
      console.log(`📄 [${document.id}] ${document.abbreviation} - ${document.documentName}`);
      
      await client.query(
        `INSERT INTO documents (id, document_name, filename, abbreviation, category, source, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
            document_name = EXCLUDED.document_name,
            filename = EXCLUDED.filename,
            abbreviation = EXCLUDED.abbreviation,
            category = EXCLUDED.category,
            source = EXCLUDED.source,
            status = EXCLUDED.status`,
        [
          document.id, 
          document.documentName, 
          document.filename, 
          document.abbreviation, 
          document.category, 
          document.officialSource, 
          document.status
        ]
      );
      
      totalDocs++;

      // 2. Upsert Articles
      let docArticles = 0;
      for (const article of articles) {
        await client.query(
          `INSERT INTO articles (id, document_id, article_number, title, text)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
              article_number = EXCLUDED.article_number,
              title = EXCLUDED.title,
              text = EXCLUDED.text`,
          [article.id, document.id, article.articleNumber, article.title || null, article.text]
        );
        docArticles++;
        totalArticles++;
      }
      
      await client.query('COMMIT');
      console.log(`   ✅ ${docArticles} artículos sincronizados.`);
      
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error(`❌ Error procesando ${file}:`, {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
    } finally {
      client.release();
    }
  }

  console.log('\n--- RESUMEN ---');
  console.log(`Documentos procesados: ${totalDocs}`);
  console.log(`Artículos insertados/actualizados: ${totalArticles}`);
  console.log('----------------\n');

  await pool.end();
}

loadLaws().catch(err => {
  console.error('💥 Error fatal en el script:', err);
  process.exit(1);
});
