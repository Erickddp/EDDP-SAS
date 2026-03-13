import { rankLegalAuthority } from "../lib/legal-authority-ranker";
import { filterArticlesByRelevance } from "../lib/article-relevance";
import { searchNormalizedArticles } from "../lib/normalized-retrieval";
import { extractStructuredIntent } from "../lib/legal-intent";
import { detectIntent } from "../lib/intent-templates";
import { analyzeQuery } from "../lib/query-analyzer";

const q = "¿Cuál es la multa por no presentar declaración mensual?";
const analysis = analyzeQuery(q, "profesional", "tecnica");
const retrieved = searchNormalizedArticles(q, 10);
const filtered = filterArticlesByRelevance(retrieved, analysis.structuredIntent!, q);
const ranked = rankLegalAuthority(q, analysis.structuredIntent!, analysis, filtered);

console.log(`Ranked Results:`);
if (ranked.primary) {
    console.log(`PRIMARY: ${ranked.primary.article.documentAbbreviation} ${ranked.primary.article.articleNumber} (Score: ${ranked.primary.score})`);
} else {
    console.log(`PRIMARY: NONE`);
}

ranked.supporting.forEach(s => {
    console.log(`SUPPORTING: ${s.article.documentAbbreviation} ${s.article.articleNumber} (Score: ${s.score})`);
});
