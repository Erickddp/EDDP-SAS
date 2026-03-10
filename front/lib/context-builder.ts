import { hybridSearchArticles } from "./hybrid-retrieval";
import { inferLegalTopic } from "./legal-search";
import { SourceReference } from "./types";

export interface RetrievalContext {
    topic: string;
    retrievedArticles: any[];
    foundation: string[];
    sources: SourceReference[];
    retrievalMeta: {
        strategy: string;
        totalMatches: number;
    };
}

/**
 * Construye el contexto legal completo para una consulta.
 */
export function buildLegalContext(query: string, limit = 3): RetrievalContext {
    const topic = inferLegalTopic(query);
    const searchResults = hybridSearchArticles(query, limit);

    // Extraer artículos reales
    const retrievedArticles = searchResults.map(r => r.article);

    // Construir fundamentos (frases cortas que resumen el hallazgo)
    const foundation = retrievedArticles.map(article => {
        return `El Artículo ${article.articleNumber} de la ${article.documentAbbreviation} (${article.documentName}) regula ${article.title || "aspectos relacionados con el tema"}.`;
    });

    // Construir fuentes para el frontend
    const sources: SourceReference[] = retrievedArticles.map(article => ({
        id: article.id,
        title: `${article.documentAbbreviation} - Art. ${article.articleNumber}`,
        type: article.documentName,
        status: "Vigente" as const,
        articleRef: `Art. ${article.articleNumber}`,
        text: article.text
    }));

    return {
        topic,
        retrievedArticles,
        foundation,
        sources,
        retrievalMeta: {
            strategy: "hybrid-local-v1",
            totalMatches: searchResults.length
        }
    };
}
