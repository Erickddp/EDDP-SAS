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
  
  let totalDocs = 0;
  let totalArticles = 0;

  for (const file of files) {
    const filePath = path.join(normalizedDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { document, articles } = content;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`📄 [${document.abbreviation}] Cargando...`);
      
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
        [document.id, document.documentName, document.filename, document.abbreviation, document.category, document.officialSource, document.status]
      );
      
      totalDocs++;

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
        totalArticles++;
      }
      
      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error(`❌ Error en ${file}:`, error.message);
    } finally {
      client.release();
    }
  }

  console.log(`\n✅ Carga completada: ${totalDocs} Docs, ${totalArticles} Arts.`);
  await pool.end();
}

loadLaws().catch(err => process.exit(1));
