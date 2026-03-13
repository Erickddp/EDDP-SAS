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
    articles: 4,
    tokens: 150,
    depth: "basic",
    responseFields: ["summary", "summaryCitations", "primaryBasis", "supportingBasis", "foundation", "foundationCitations", "citations"]
  },
  normal: {
    articles: 4,
    tokens: 350,
    depth: "medium",
    responseFields: ["summary", "summaryCitations", "primaryBasis", "supportingBasis", "foundation", "foundationCitations", "explanation", "explanationCitations", "example", "exampleCitations", "citations"]
  },
  complex: {
    articles: 7,
    tokens: 900,
    depth: "deep",
    responseFields: [
      "summary",
      "summaryCitations",
      "foundation",
      "foundationCitations",
      "explanation",
      "explanationCitations",
      "example",
      "exampleCitations",
      "relatedArticles",
      "primaryBasis",
      "supportingBasis",
      "citations"
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
  "summaryCitations": ["ref_1"],
  "primaryBasis": {
    "ref": "Art. X Ley Y",
    "law": "Abreviatura",
    "articleNumber": "Número",
    "whySelected": "Razón jurídica de selección como base primaria"
  },
  "supportingBasis": [
    { "ref": "Art. Z", "role": "definition" }
  ],
  "foundation": [
    { "type": "primary", "ref": "Abreviatura Ley Art. Número" }
  ],
  "foundationCitations": ["ref_1"],
  "citations": [
    {
      "ref": "ref_1",
      "type": "primary",
      "sourceId": "id_del_articulo",
      "quote": "extracto breve del artículo",
      "law": "Abreviatura",
      "articleNumber": "Número"
    }
  ]
}`,
  normal: `{
  "summary": "Resumen ejecutivo en 1-3 frases.",
  "summaryCitations": ["ref_1"],
  "primaryBasis": {
    "ref": "Art. X Ley Y",
    "law": "Abreviatura",
    "articleNumber": "Número",
    "whySelected": "Explicación de por qué este artículo es la base jurídica principal"
  },
  "supportingBasis": [
    { "ref": "Art. Z", "role": "procedure" },
    { "ref": "Art. W", "role": "sanction" }
  ],
  "foundation": [
    { "type": "primary", "ref": "Art. principal" },
    { "type": "supporting", "ref": "Art. de apoyo" }
  ],
  "foundationCitations": ["ref_1", "ref_2"],
  "explanation": "Explicación clara en lenguaje sencillo.",
  "explanationCitations": ["ref_1", "ref_2"],
  "example": "Ejemplo práctico numérico o situacional.",
  "exampleCitations": ["ref_1"],
  "citations": [
    {
      "ref": "ref_1",
      "type": "primary",
      "sourceId": "id_del_articulo",
      "quote": "extracto de apoyo",
      "law": "Abreviatura",
      "articleNumber": "Número"
    }
  ],
  "scenarios": ["contexto 1"],
  "consequences": ["impacto 1"],
  "certainty": "nivel de certeza",
  "disclaimer": "aviso legal"
}`,
  complex: `{
  "summary": "Resumen ejecutivo completo.",
  "summaryCitations": ["ref_1"],
  "primaryBasis": {
    "ref": "Art. X Ley Y",
    "law": "Abreviatura",
    "articleNumber": "Número",
    "subsection": "fracción o inciso si aplica",
    "whySelected": "Análisis de autoridad y relevancia para el caso"
  },
  "supportingBasis": [
    { "ref": "Art. Z", "role": "procedure" },
    { "ref": "Art. W", "role": "sanction" },
    { "ref": "Art. V", "role": "correlation" }
  ],
  "foundation": [
    { "type": "primary", "ref": "Art. principal 1" },
    { "type": "supporting", "ref": "Art. de apoyo" }
  ],
  "foundationCitations": ["ref_1", "ref_2", "ref_3"],
  "explanation": "Explicación detallada del mecanismo legal.",
  "explanationCitations": ["ref_1", "ref_2", "ref_3"],
  "example": "Ejemplo práctico numérico o de aplicación.",
  "exampleCitations": ["ref_1", "ref_2"],
  "relatedArticles": ["Artículos secundarios."],
  "legalInterpretation": "Análisis jurídico detallado.",
  "citations": [
    {
      "ref": "ref_1",
      "type": "primary",
      "sourceId": "id_del_articulo",
      "quote": "extracto relevante",
      "law": "Abreviatura",
      "articleNumber": "Número",
      "subsection": "fracción IV"
    }
  ],
  "scenarios": ["contexto 1"],
  "consequences": ["impacto 1"],
  "certainty": "nivel de certeza",
  "disclaimer": "aviso legal"
}`
};
