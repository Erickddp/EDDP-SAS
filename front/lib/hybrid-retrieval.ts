import { ALL_LAW_ARTICLES } from "./laws";
import { LawArticle } from "./types";
import { normalizeQuery, tokenizeQuery, inferLegalTopic, searchArticles } from "./legal-search";
import { expandQueryTokens, expandNormalizedQuery } from "./legal-synonyms";

export interface HybridSearchResult {
    article: LawArticle;
    keywordScore: number;
    semanticScore: number;
    finalScore: number;
    matchReasons: string[];
}

/**
 * Calcula el puntaje semántico basado en expansión de términos y frases relacionadas.
 */
function scoreSemanticMatch(article: LawArticle, expandedTerms: string[], expandedPhrases: string[], normalizedQuery: string): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const articleText = normalizeQuery(article.text);
    const articleTitle = normalizeQuery(article.title || "");
    const articleKeywords = article.keywords.map(k => normalizeQuery(k));

    // 1. Coincidencia en keywords ampliadas (+10)
    for (const term of expandedTerms) {
        if (articleKeywords.includes(term)) {
            score += 5; // Puntaje base semántico por término expandido
            if (!reasons.includes("Término relacionado en keywords")) {
                reasons.push("Término relacionado en keywords");
            }
        }
    }

    // 2. Coincidencia de frases relacionadas (+15)
    for (const phrase of expandedPhrases) {
        if (articleText.includes(phrase) || articleTitle.includes(phrase)) {
            score += 15;
            if (!reasons.includes("Frase semántica coincidente")) {
                reasons.push("Frase semántica coincidente");
            }
        }
    }

    // 3. Coincidencia semántica simple en texto/título (+5 por término)
    const queryTokens = tokenizeQuery(normalizedQuery);
    for (const token of queryTokens) {
        if (articleText.includes(token) || articleTitle.includes(token)) {
            score += 2;
        }
    }

    return { score, reasons };
}

/**
 * Realiza una búsqueda híbrida combinando precisión determinística y expansión semántica.
 */
export function hybridSearchArticles(query: string, limit = 4): HybridSearchResult[] {
    const normalizedQuery = normalizeQuery(query);
    const topic = inferLegalTopic(query);
    const tokens = tokenizeQuery(query);
    const expandedTerms = expandQueryTokens(tokens);
    const expandedPhrases = expandNormalizedQuery(query);

    // Obtener una base amplia de artículos candidatos usando la búsqueda determinística actual
    // Usamos un límite mayor para re-rankear después (escala con profundidad)
    const candidatePool = Math.max(12, limit * 3);
    const keywordCandidates = searchArticles(query, candidatePool);
    const candidateIds = new Set(keywordCandidates.map(a => a.id));

    const allResults: HybridSearchResult[] = [];

    // Recorrer artículos (optimizando: priorizar candidatos o artículos del tema)
    const targetArticles = ALL_LAW_ARTICLES.filter(a => {
        // Si fue detectado por keyword, considerarlo
        if (candidateIds.has(a.id)) return true;
        // Si el tema coincide, considerarlo para semántica
        const topicDocMapping: Record<string, string> = { iva: "LIVA", isr: "LISR", resico: "LISR", declaraciones: "CFF", multas: "CFF" };
        return topicDocMapping[topic] === a.documentAbbreviation;
    });

    for (const article of targetArticles) {
        // Calculamos keywordScore rudimentario basado en la lógica de searchArticles pero simplificado aquí
        // o simplemente usamos una escala sobre si fue candidato o no.
        // Para mayor fidelidad, intentamos estimar el keywordScore.
        let keywordScore = 0;
        if (candidateIds.has(article.id)) {
            // Asignamos un puntaje base proporcional a su posición en la búsqueda determinística
            const index = keywordCandidates.findIndex(c => c.id === article.id);
            keywordScore = 50 - (index * 4); // El primero tiene ~50, el doceavo ~2
        }

        const { score: semanticScore, reasons } = scoreSemanticMatch(article, expandedTerms, expandedPhrases, normalizedQuery);

        // Scoring híbrido: 65% keywords, 35% semántica
        const finalScore = (keywordScore * 0.65) + (semanticScore * 0.35);

        if (finalScore > 0) {
            allResults.push({
                article,
                keywordScore,
                semanticScore,
                finalScore,
                matchReasons: reasons
            });
        }
    }

    return allResults
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);
}

/**
 * Herramienta de depuración para la búsqueda híbrida.
 */
export function debugHybridSearch(query: string) {
    const topic = inferLegalTopic(query);
    const tokens = tokenizeQuery(query);
    const expandedTerms = expandQueryTokens(tokens);
    const results = hybridSearchArticles(query, 5);

    return {
        query,
        topic,
        expandedTerms,
        results: results.map(r => ({
            article: `${r.article.documentAbbreviation} Art. ${r.article.articleNumber}`,
            scores: {
                final: r.finalScore.toFixed(2),
                keyword: r.keywordScore,
                semantic: r.semanticScore
            },
            reasons: r.matchReasons
        }))
    };
}
