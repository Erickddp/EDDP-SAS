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
 * Intenta primero PostgreSQL y cae a JSON normalizado si falla o no hay resultados.
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
        
        // 1. Intentar recuperación desde PostgreSQL (Fase 2/3)
        // Aumentamos ligeramente el límite interno para tener margen de filtrado post-recuperación
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
    } catch (error: any) {
        console.error("❌ [ContextBuilder] Fallo crítico en PostgreSQL retrieval:", {
            message: error.message,
            stack: error.stack?.split('\n')[0]
        });
        // Si hay un error de conexión (ej. DATABASE_URL inválida), caemos al fallback de JSON
    }

    // 2. Fallback explícito a JSON normalizado (In-Memory)
    const fallbackStart = Date.now();
    console.log("🔄 [ContextBuilder] Usando fallback a JSON normalizado (Léxico)...");
    const fallbackContext = await buildContextFromNormalized(query, limit, parsedRef, excludeIds, preferredLaw);
    const fallbackDuration = Date.now() - fallbackStart;
    
    console.log(`ℹ️ [ContextBuilder] Fallback JSON completado con ${fallbackContext.retrievedArticles.length} resultados en ${fallbackDuration}ms.`);
    
    return {
        ...fallbackContext,
        fallbackUsed: true,
        retrievalMeta: {
            ...fallbackContext.retrievalMeta,
            strategy: `${fallbackContext.retrievalMeta.strategy} (fallback-json)`
        }
    };
}
