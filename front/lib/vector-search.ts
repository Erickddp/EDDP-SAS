import { getClient } from "./db";
import { generateEmbedding } from "./embedding";
import { ParsedLegalReference } from "./law-alias";

export async function searchArticles(query: string, limit: number = 5, filters?: ParsedLegalReference) {
    const embedding = await generateEmbedding(query);
    const embeddingString = `[${embedding.join(',')}]`;

    const targetAbbrev = filters?.lawAbbreviation || null;
    const targetArticle = filters?.articleNumber || null;

    const client = await getClient();
    try {
        const { rows: data } = await client.query(`
            SELECT * FROM search_legal_hybrid($1::vector, $2, $3, $4);
        `, [embeddingString, limit, targetAbbrev, targetArticle]);

        // Observability Logs
        console.log(`\n┌──────── RIGOROUS RAG PIPELINE ────────┐`);
        console.log(`│ Query: "${query}"`);
        console.log(`│ Filtros Extraídos -> Ley: [${targetAbbrev || 'N/A'}] | Art: [${targetArticle || 'N/A'}]`);
        if (filters?.fractionLabel) console.log(`│ Sección Detectada -> Fracción: ${filters.fractionLabel}`);
        if (filters?.incisoLabel) console.log(`│ Sección Detectada -> Inciso: ${filters.incisoLabel}`);
        if (filters?.apartadoLabel) console.log(`│ Sección Detectada -> Apartado: ${filters.apartadoLabel}`);
        console.log(`├───────────────────────────────────────┤`);
        console.log(`│ TOP 5 RESULTADOS POST-BOOSTING:`);
        data.forEach((r, i) => {
            console.log(`│ ${i+1}. [${r.abbreviation}] Art. ${r.article_number} (Score: ${r.similarity.toFixed(3)})`);
        });
        console.log(`└───────────────────────────────────────┘\n`);

        return data.map(r => ({
            id: r.id,
            articleNumber: r.article_number,
            title: `Artículo ${r.article_number}`,
            text: r.content,
            documentAbbreviation: r.abbreviation,
            documentName: r.abbreviation, // Using abbreviation as the short name if needed
            sections: r.sections,
            similarity: r.similarity
        }));
    } finally {
        client.release();
    }
}
