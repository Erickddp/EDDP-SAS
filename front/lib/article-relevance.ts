import { LawArticle, StructuredIntent } from "./types";
import { normalizeQuery, tokenizeQuery } from "./legal-search";

/**
 * Maps legal domains to document abbreviations.
 */
const DOMAIN_DOC_MAPPING: Record<StructuredIntent["legalDomain"], string[]> = {
    fiscal: ["LISR", "LIVA", "CFF", "LIEPS", "RESICO"],
    constitucional: ["CPEUM"],
    administrativo: ["CFF", "LFPA"],
    laboral: ["LFT"],
    otro: []
};

/**
 * Filter and score articles based on structured legal intent.
 */
export function filterArticlesByRelevance(
    articles: LawArticle[],
    intent: StructuredIntent,
    query: string
): LawArticle[] {
    const queryTokens = tokenizeQuery(query);
    
    return articles
        .map(article => {
            let score = 0;
            const articleText = normalizeQuery(article.text);
            const articleTitle = normalizeQuery(article.title || "");

            // 1. Domain Match (+50)
            const allowedDocs = DOMAIN_DOC_MAPPING[intent.legalDomain] || [];
            if (allowedDocs.includes(article.documentAbbreviation)) {
                score += 50;
            }

            // 2. Entity Overlap (+10 per entity)
            for (const entity of intent.entities) {
                if (articleText.includes(entity) || articleTitle.includes(entity)) {
                    score += 15;
                }
            }

            // 3. Keyword Match (+5 per token)
            for (const token of queryTokens) {
                if (articleText.includes(token) || articleTitle.includes(token)) {
                    score += 5;
                }
            }

            // 4. Intent Type Specific Boost (+20)
            if (intent.intentType === "multa" && (articleText.includes("multa") || articleText.includes("sancion"))) {
                score += 20;
            }
            if (intent.intentType === "plazo" && (articleText.includes("plazo") || articleText.includes("fecha") || articleText.includes("dias"))) {
                score += 20;
            }
            if (intent.intentType === "calculo" && (articleText.includes("calculo") || articleText.includes("porcentaje") || articleText.includes("tasa"))) {
                score += 20;
            }

            return { article, score };
        })
        .filter(item => item.score >= 0) // Minimum threshold reduced for debugging
        .sort((a, b) => b.score - a.score)
        .map(item => item.article);
}
