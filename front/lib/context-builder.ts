import { SourceReference } from "./types";
import { ParsedLegalReference } from "./law-alias";
import { buildContextFromNormalized } from "./normalized-retrieval";

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
 * Fuente de verdad: archivos locales normalizados en data/legal/normalized.
 */
export async function buildLegalContext(
    query: string, 
    parsedRef?: ParsedLegalReference, 
    limit = 3,
    excludeIds: string[] = [],
    preferredLaw?: string | null
): Promise<RetrievalContext> {
    return buildContextFromNormalized(query, limit, parsedRef, excludeIds, preferredLaw);
}
