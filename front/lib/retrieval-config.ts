/**
 * Retrieval Configuration — Central constants that control adaptive behavior per complexity tier.
 * 
 * Used by query-analyzer and route.ts to determine retrieval limits,
 * token budgets, and which response fields to request from the LLM.
 */

export interface RetrievalTierConfig {
    /** Max articles to retrieve from vector search */
    articles: number;
    /** Token budget hint for LLM response */
    tokens: number;
    /** Depth label for prompt instructions */
    depth: "basic" | "medium" | "deep";
    /** Fields the LLM must include in its JSON response */
    responseFields: string[];
}

export const RETRIEVAL_CONFIG: Record<"simple" | "normal" | "complex", RetrievalTierConfig> = {
    simple: {
        articles: 2,
        tokens: 150,
        depth: "basic",
        responseFields: ["summary", "foundation", "disclaimer"]
    },
    normal: {
        articles: 4,
        tokens: 350,
        depth: "medium",
        responseFields: ["summary", "foundation", "scenarios", "consequences", "certainty", "disclaimer"]
    },
    complex: {
        articles: 7,
        tokens: 900,
        depth: "deep",
        responseFields: [
            "summary",
            "foundation",
            "relatedArticles",
            "legalInterpretation",
            "scenarios",
            "consequences",
            "certainty",
            "disclaimer"
        ]
    }
};

/**
 * Response schema templates per complexity tier.
 * These are injected into the system prompt to tell the LLM exactly what JSON shape to produce.
 */
export const RESPONSE_SCHEMAS: Record<"simple" | "normal" | "complex", string> = {
    simple: `{
  "summary": "Respuesta directa en 1-2 frases.",
  "foundation": ["Artículo principal que sustenta la respuesta."],
  "disclaimer": "Nota aclaratoria breve."
}`,
    normal: `{
  "summary": "Resumen ejecutivo en 1-3 frases.",
  "foundation": ["Lista de artículos que sustentan la respuesta."],
  "scenarios": ["Casos o requisitos donde aplica."],
  "consequences": ["Riesgos o consecuencias de no cumplir."],
  "certainty": "Alta | Media | Baja",
  "disclaimer": "Nota aclaratoria."
}`,
    complex: `{
  "summary": "Resumen ejecutivo completo.",
  "foundation": ["Artículos principales que sustentan la respuesta."],
  "relatedArticles": ["Artículos secundarios o de otras leyes relacionados con el tema."],
  "legalInterpretation": "Análisis jurídico detallado de la disposición, incluyendo criterios del SAT o tribunales cuando aplique.",
  "scenarios": ["Escenarios posibles donde aplica, con condiciones específicas."],
  "consequences": ["Consecuencias legales, multas, recargos o riesgos detallados."],
  "certainty": "Alta | Media | Baja",
  "disclaimer": "Nota aclaratoria."
}`
};
