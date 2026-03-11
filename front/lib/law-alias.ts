export const ALIAS_MAP: Record<string, string> = {
  "cpeum": "CPEUM",
  "constitucion": "CPEUM",
  "constitucional": "CPEUM",
  "constitucion politica": "CPEUM",
  "liva": "LIVA",
  "iva": "LIVA",
  "ley del iva": "LIVA",
  "cff": "CFF",
  "codigo fiscal": "CFF",
  "lisr": "LISR",
  "isr": "LISR",
  "ley del isr": "LISR",
  "lft": "LFT",
  "ley federal del trabajo": "LFT"
};

export function detectLawAlias(query: string): string | null {
  const normalized = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    if (new RegExp(`\\b${alias}\\b`).test(normalized)) {
      return canonical;
    }
  }
  return null;
}

export function extractArticleNumber(query: string): string | null {
  const normalized = query.toLowerCase().replace(/primero/, '1');
  const match = normalized.match(/(?:art[ií]culo|art\.?)\s*(\d+[a-z]?(?:-\w+)?)/i);
  return match ? match[1] : null;
}

export function extractFraction(query: string): string | null {
  const match = query.match(/(?:fracc[ií]?[oó]n|fracc?\.?)\s+([IVXLCDMivxlcdm]+|\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

export function extractInciso(query: string): string | null {
  const match = query.match(/(?:inciso|inc\.?)\s+([a-z])/i);
  return match ? match[1].toLowerCase() : null;
}

export function extractApartado(query: string): string | null {
  const match = query.match(/(?:apartado|apart\.?)\s+([a-z])/i);
  return match ? match[1].toUpperCase() : null;
}

export interface ParsedLegalReference {
  lawAbbreviation: string | null;
  articleNumber: string | null;
  fractionLabel: string | null;
  incisoLabel: string | null;
  apartadoLabel: string | null;
}

/**
 * Detecta desde el texto del usuario la ley, el artículo exacto y secciones internas a las que se hace referencia.
 */
export function parseLegalReference(query: string): ParsedLegalReference {
  return {
    lawAbbreviation: detectLawAlias(query),
    articleNumber: extractArticleNumber(query),
    fractionLabel: extractFraction(query),
    incisoLabel: extractInciso(query),
    apartadoLabel: extractApartado(query)
  };
}
