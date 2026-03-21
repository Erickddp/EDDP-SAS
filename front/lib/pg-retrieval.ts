import { query } from "./db";
import { LawArticle, SourceReference } from "./types";
import { ParsedLegalReference } from "./law-alias";
import { inferLegalTopic, normalizeQuery, tokenizeQuery } from "./legal-search";
import { generateEmbedding } from "./embedding";

/**
 * Recupera artículos desde PostgreSQL usando búsqueda híbrida real (Fase 3):
 * 1. Referencia Exacta (Parsing determinante)
 * 2. Similitud Vectorial (Semántica via pgvector)
 * 3. Coincidencia Léxica (SQL ILIKE)
 */
export async function searchPostgresArticles(
    inputQuery: string,
    limit: number = 10,
    parsedRef?: ParsedLegalReference
): Promise<LawArticle[]> {
    try {
        const tokens = tokenizeQuery(inputQuery);
        const normalizedQuery = normalizeQuery(inputQuery);
        
        const targetAbbrev = parsedRef?.lawAbbreviation || null;
        const targetArticle = parsedRef?.articleNumber || null;
        const searchTerms = tokens.length > 0 ? tokens : [normalizedQuery];
        const ilikeTerms = searchTerms.map(t => `%${t}%`);

        // 1. Generar embedding para la consulta (RAG Semántico)
        let queryVector: number[] | null = null;
        try {
            queryVector = await generateEmbedding(inputQuery);
        } catch (e) {
            console.warn("⚠️ [PG-Retrieval] No se pudo generar embedding, usando solo léxico:", e);
        }

        const queryVectorString = queryVector ? `[${queryVector.join(',')}]` : null;

        // 2. Consulta Híbrida sobre la tabla 'articles'
        const sqlPrimary = `
            SELECT 
                a.id, a.document_id, d.document_name, d.abbreviation,
                a.article_number, a.title, a.text as content, d.source, d.status,
                -- Scoring Híbrido Optimizado (Fase 3)
                (CASE WHEN d.abbreviation = $2::text AND a.article_number = $3::text THEN 200 ELSE 0 END) + -- BOOST EXACTO (Aumentado)
                (CASE WHEN $4::vector IS NOT NULL THEN (1 - (a.embedding <=> $4::vector)) * 40 ELSE 0 END) + -- BOOST SEMÁNTICO (Aumentado de 20 a 40)
                (CASE WHEN a.text ILIKE ANY($5::text[]) THEN 10 ELSE 0 END) -- BOOST LÉXICO (Aumentado de 5 a 10)
                AS combined_score,
                (CASE WHEN $4::vector IS NOT NULL THEN (1 - (a.embedding <=> $4::vector)) ELSE 0 END) AS semantic_sim
            FROM articles a
            JOIN documents d ON d.id = a.document_id
            WHERE 
                (d.abbreviation = $2::text AND a.article_number = $3::text) -- Match exacto
                OR ($4::vector IS NOT NULL AND (1 - (a.embedding <=> $4::vector)) > 0.35) -- Match semántico (Umbral bajado a 0.35 para mayor exhaustividad)
                OR (($3::text IS NULL OR $3::text = '') AND (
                    a.text ILIKE ANY($5::text[]) OR a.title ILIKE ANY($5::text[])
                )) -- Match léxico
            ORDER BY combined_score DESC
            LIMIT $1::int
        `;

        const { rows: primaryRows } = await query(sqlPrimary, [
            limit, 
            targetAbbrev, 
            targetArticle, 
            queryVectorString, 
            ilikeTerms
        ]);

        if (primaryRows.length > 0) {
            console.log(`📡 [PG-Retrieval] Encontrados ${primaryRows.length} resultados en 'articles'.`);
            primaryRows.forEach((r, i) => {
                console.log(`   ${i+1}. [${r.abbreviation}] Art. ${r.article_number} - Score: ${Number(r.combined_score).toFixed(2)} (Sem: ${Number(r.semantic_sim).toFixed(3)})`);
            });
            return primaryRows.map(r => ({
                id: r.id,
                documentId: r.document_id,
                documentName: r.document_name,
                documentAbbreviation: r.abbreviation,
                articleNumber: r.article_number,
                title: r.title || undefined,
                text: r.content,
                keywords: [],
                source: r.source || "",
                fragments: []
            }));
        }

        // Si no hay resultados primarios, retornamos vacío (deprecated fallback eliminado)
        console.log(`📡 [PG-Retrieval] No hay resultados de artículos en la consulta.`);
        return [];
    } catch (error) {
        console.error("❌ [PG-Retrieval] Error Híbrido:", error);
        return [];
    }
}

/**
 * Construye el contexto completo usando PostgreSQL Híbrido.
 */
export async function buildPostgresContext(
    queryText: string,
    limit: number = 4,
    parsedRef?: ParsedLegalReference
) {
    const topic = inferLegalTopic(queryText);
    const articles = await searchPostgresArticles(queryText, limit, parsedRef);
    
    // Construir fundamentos
    const foundation = articles.slice(0, 3).map(article => {
        return `El Artículo ${article.articleNumber} de la ${article.documentAbbreviation} regula ${article.title || "este tema"}.`;
    });

    // Construir fuentes
    const sources: SourceReference[] = articles.map(article => ({
        id: article.id,
        title: `${article.documentAbbreviation} - Art. ${article.articleNumber}`,
        type: article.documentAbbreviation,
        status: "Vigente" as const,
        articleRef: `Art. ${article.articleNumber}`,
        text: article.text
    }));

    return {
        topic,
        retrievedArticles: articles,
        foundation,
        sources,
        retrievalMeta: {
            strategy: "postgres-hybrid-v1",
            totalMatches: articles.length
        }
    };
}
