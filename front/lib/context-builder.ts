import { SourceReference } from "./types";
import { ParsedLegalReference } from "./law-alias";
import { buildContextFromNormalized } from "./normalized-retrieval";
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
 * Intenta primero PostgreSQL y cae a JSON normalizado si falla.
 */
export async function buildLegalContext(
    query: string,
    parsedRef?: ParsedLegalReference,
    limit = 3,
    excludeIds: string[] = [],
    preferredLaw?: string | null
): Promise<RetrievalContext> {
    try {
        console.log(`🔍 [ContextBuilder] Iniciando recuperación para: "${query}"`);
        
        // 1. Intentar recuperación desde PostgreSQL (Fase 2)
        const pgContext = await buildPostgresContext(query, limit, parsedRef);
        
        if (pgContext.retrievedArticles && pgContext.retrievedArticles.length > 0) {
            console.log(`✅ [ContextBuilder] Recuperados ${pgContext.retrievedArticles.length} artículos desde PostgreSQL.`);
            return {
                ...pgContext,
                fallbackUsed: false
            };
        }
        
        console.warn(`⚠️ [ContextBuilder] PostgreSQL no devolvió resultados para la consulta.`);
    } catch (error) {
        console.error("❌ [ContextBuilder] Error en PostgreSQL retrieval:", error);
    }

    // 2. Fallback explícito a JSON normalizado (In-Memory)
    console.log("🔄 [ContextBuilder] Usando fallback a JSON normalizado...");
    const fallbackContext = await buildContextFromNormalized(query, limit, parsedRef, excludeIds, preferredLaw);
    
    return {
        ...fallbackContext,
        fallbackUsed: true,
        retrievalMeta: {
            ...fallbackContext.retrievalMeta,
            strategy: `${fallbackContext.retrievalMeta.strategy} (fallback-json)`
        }
    };
}
