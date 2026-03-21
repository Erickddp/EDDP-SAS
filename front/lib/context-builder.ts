import { SourceReference } from "./types";
import { ParsedLegalReference } from "./law-alias";
import { buildPostgresContext } from "./pg-retrieval";

export interface RetrievalContext {
    topic: string;
    retrievedArticles: any[];
    foundation: string[];
    sources: SourceReference[];
    retrievalMeta: {
        strategy: string;
        totalMatches: number;
    };
    fallbackUsed?: boolean;
}

/**
 * Construye el contexto legal completo para una consulta.
 * Utiliza PostgreSQL exclusivamente como motor de búsqueda.
 */
export async function buildLegalContext(
    query: string,
    parsedRef?: ParsedLegalReference,
    limit = 3,
    excludeIds: string[] = [],
    preferredLaw?: string | null
): Promise<RetrievalContext> {
    const startTime = Date.now();
    try {
        console.log(`🔍 [ContextBuilder] Iniciando recuperación para: "${query}"`);
        
        // 1. Recuperación desde PostgreSQL (Fase 2/3 SaaS)
        const pgContext = await buildPostgresContext(query, limit + 2, parsedRef);
        
        if (pgContext.retrievedArticles && pgContext.retrievedArticles.length > 0) {
            const duration = Date.now() - startTime;
            console.log(`✅ [ContextBuilder] PostgreSQL devolvió ${pgContext.retrievedArticles.length} artículos en ${duration}ms.`);
            return {
                ...pgContext,
                retrievedArticles: pgContext.retrievedArticles.slice(0, limit),
                fallbackUsed: false
            };
        }
        
        console.warn(`⚠️ [ContextBuilder] PostgreSQL conectado pero sin resultados relevantes para la consulta.`);
        
        // Retornar contexto vacío si no hay resultados
        return {
            topic: pgContext.topic || "general",
            retrievedArticles: [],
            foundation: [],
            sources: [],
            retrievalMeta: {
                strategy: "postgres-empty",
                totalMatches: 0
            },
            fallbackUsed: false
        };

    } catch (error: any) {
        console.error("❌ [ContextBuilder] Fallo en PostgreSQL retrieval:", {
            message: error.message,
            stack: error.stack?.split('\n')[0]
        });
        
        // En caso de error severo devolvemos array vacío para evitar romper el hilo de la LLM
        return {
            topic: "general",
            retrievedArticles: [],
            foundation: [],
            sources: [],
            retrievalMeta: {
                strategy: "postgres-error",
                totalMatches: 0
            },
            fallbackUsed: false
        };
    }
}
