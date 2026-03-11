import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/legal/normalized/01.json');
const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const articles = content.articles;
const counts: Record<string, number> = {};
const lengths: Record<string, number> = {};

console.log(`Total artículos: ${articles.length}`);

articles.forEach((art: any) => {
    counts[art.articleNumber] = (counts[art.articleNumber] || 0) + 1;
    lengths[art.articleNumber] = art.text.length;
});

const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
const longArticles = Object.entries(lengths).filter(([_, len]) => len > 20000); // 20k chars is roughly 5k-8k tokens

console.log("Duplicados detectados:");
console.dir(duplicates);

console.log("\nArtículos muy largos (>20k chars):");
console.dir(longArticles);

if (counts["28"]) {
    console.log(`\nArtículo 28: Count=${counts["28"]}, Length=${lengths["28"]}`);
} else {
    // Search for variations like 28o
    const variations = Object.keys(counts).filter(k => k.startsWith("28"));
    console.log(`\nVariaciones de 28: ${variations.map(k => `${k} (Len: ${lengths[k]})`).join(", ")}`);
}
