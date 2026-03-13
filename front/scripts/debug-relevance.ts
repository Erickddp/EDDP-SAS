import { filterArticlesByRelevance } from "../lib/article-relevance";
import { searchNormalizedArticles } from "../lib/normalized-retrieval";
import { extractStructuredIntent } from "../lib/legal-intent";
import { detectIntent } from "../lib/intent-templates";

const q = "¿Cuál es la multa por no presentar declaración mensual?";
const retrieved = searchNormalizedArticles(q, 10);
const detected = detectIntent(q);
const intent = extractStructuredIntent(q, detected);

console.log(`Intent: ${JSON.stringify(intent, null, 2)}`);
console.log(`Retrieved: ${retrieved.length}`);

const filtered = filterArticlesByRelevance(retrieved, intent, q);
console.log(`Filtered: ${filtered.length}`);
filtered.forEach(f => console.log(` - ${f.documentAbbreviation} ${f.articleNumber}`));
