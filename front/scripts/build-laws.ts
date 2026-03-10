import fs from 'fs';
import path from 'path';
import { 
  LawManifestEntry, 
  NormalizedDocument, 
  parseArticles 
} from '../lib/legal-ingestion';

const RAW_DIR = path.join(process.cwd(), 'data/legal/raw');
const NORMALIZED_DIR = path.join(process.cwd(), 'data/legal/normalized');
const MANIFEST_PATH = path.join(RAW_DIR, 'manifest.json');

async function main() {
  console.log('🚀 Iniciando ingestión legal...');

  // Ensure directories exist
  if (!fs.existsSync(NORMALIZED_DIR)) {
    fs.mkdirSync(NORMALIZED_DIR, { recursive: true });
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Error: No se encontró el manifest en ${MANIFEST_PATH}`);
    console.info(`💡 Tip: Puedes copiar data/legal/raw/manifest.example.json a data/legal/raw/manifest.json para empezar.`);
    process.exit(1);
  }

  const manifestData: LawManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  
  console.log(`📜 Manifest cargado con ${manifestData.length} entradas.\n`);

  let totalArticles = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const entry of manifestData) {
    const rawFilePath = path.join(RAW_DIR, entry.filename);
    
    if (!fs.existsSync(rawFilePath)) {
      console.warn(`⚠️ Advertencia: El archivo ${entry.filename} no existe. Saltando...`);
      errorCount++;
      continue;
    }

    try {
      console.log(`📄 Procesando [${entry.id}] ${entry.documentName}...`);
      const rawText = fs.readFileSync(rawFilePath, 'utf-8');
      
      const articles = parseArticles(entry.id, rawText);
      
      const normalizedDoc: NormalizedDocument = {
        document: {
          id: entry.id,
          filename: entry.filename,
          documentName: entry.documentName,
          abbreviation: entry.abbreviation,
          category: entry.category,
          officialSource: entry.officialSource,
          status: entry.status
        },
        articles
      };

      const outputFileName = `${entry.id}.json`;
      const outputPath = path.join(NORMALIZED_DIR, outputFileName);
      
      fs.writeFileSync(outputPath, JSON.stringify(normalizedDoc, null, 2));
      
      console.log(`   ✅ Generado ${outputFileName} con ${articles.length} artículos.`);
      totalArticles += articles.length;
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error procesando ${entry.filename}:`, error);
      errorCount++;
    }
  }

  console.log('\n--- RESUMEN ---');
  console.log(`✅ Documentos procesados: ${successCount}`);
  console.log(`⚠️ Errores/Saltados: ${errorCount}`);
  console.log(`📑 Total de artículos detectados: ${totalArticles}`);
  console.log(`📍 Ubicación: data/legal/normalized/`);
  console.log('----------------\n');
}

main().catch(console.error);
