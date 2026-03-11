import { hybridSearchArticles } from "./hybrid-retrieval";
import { inferLegalTopic } from "./legal-search";
import { SourceReference } from "./types";
import { getLegalContextFromDB } from "./db-retrieval";
import { ParsedLegalReference } from "./law-alias";

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
 * Intenta recuperar desde la Base de Datos primero.
 * Si falla o no hay resultados, hace fallback al mock local.
 */
export async function buildLegalContext(query: string, parsedRef?: ParsedLegalReference, limit = 3): Promise<RetrievalContext> {
    const dbContext = await getLegalContextFromDB(query, limit, parsedRef);

    // Si la DB devolvió resultados, la usamos como fuente oficial de la verdad
    if (!dbContext.fallbackUsed && dbContext.retrievedArticles.length > 0) {
        return {
            topic: dbContext.topic,
            retrievedArticles: dbContext.retrievedArticles,
            foundation: dbContext.foundation,
            sources: dbContext.sources,
            retrievalMeta: dbContext.retrievalMeta
        };
    }

    // FALLBACK: Usar el comportamiento estático viejo si la DB falla
    console.warn("⚠️ Aplicando fallback: ContextBuilder usando hybridSearchArticles estático");
    const topic = inferLegalTopic(query);
    const searchResults = hybridSearchArticles(query, limit);

    const retrievedArticles = searchResults.map(r => r.article);

    const foundation = retrievedArticles.map(article => {
        return `El Artículo ${article.articleNumber} de la ${article.documentAbbreviation} (${article.documentName}) regula ${article.title || "aspectos relacionados con el tema"}.`;
    });

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
