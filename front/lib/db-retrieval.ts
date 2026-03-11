import { searchArticles } from "./vector-search";
import { inferLegalTopic } from "./legal-search";
import { RetrievalContext } from "./context-builder";
import { SourceReference } from "./types";
import { ParsedLegalReference } from "./law-alias";

/**
 * Recupera el contexto legal real desde Supabase/PostgreSQL.
 */
export async function getLegalContextFromDB(query: string, limit: number = 5, parsedRef?: ParsedLegalReference): Promise<RetrievalContext & { fallbackUsed: boolean }> {
    const topic = inferLegalTopic(query);
    let retrievedArticles: any[] = [];
    let fallbackUsed = false;

    try {
        // Fetch from Supabase using vector-search which implements hybrid search
        retrievedArticles = await searchArticles(query, limit, parsedRef);
        
        if (!retrievedArticles || retrievedArticles.length === 0) {
            fallbackUsed = true;
        }
    } catch (error) {
        console.error("❌ Error en DB retrieval, usando fallback:", error);
        fallbackUsed = true;
    }

    // Construir fundamentos (frases cortas que resumen el hallazgo)
    const foundation = retrievedArticles.map(article => {
        return `El Artículo ${article.articleNumber} de la ${article.documentAbbreviation} regula ${article.title || "aspectos relacionados con el tema"}.`;
    });

    // Construir fuentes para el frontend
    const sources: SourceReference[] = retrievedArticles.map(article => ({
        id: article.id,
        title: `${article.documentAbbreviation} - Art. ${article.articleNumber}`,
        type: article.documentAbbreviation,
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
            strategy: fallbackUsed ? "hybrid-local-fallback" : "database-hybrid",
            totalMatches: retrievedArticles.length
        },
        fallbackUsed
    };
}
