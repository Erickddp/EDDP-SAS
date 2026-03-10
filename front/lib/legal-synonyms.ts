import { normalizeQuery } from "./legal-search";

export const LEGAL_SYNONYMS: Record<string, string[]> = {
    iva: ["impuesto al valor agregado", "valor agregado", "traslado de iva", "retencion de iva"],
    isr: ["impuesto sobre la renta", "renta"],
    resico: ["regimen simplificado de confianza", "simplificado de confianza"],
    declaracion: ["declaracion mensual", "declaracion anual", "presentacion de declaraciones"],
    multa: ["sancion", "infraccion", "penalizacion"],
    factura: ["cfdi", "comprobante fiscal", "comprobante digital"],
    deduccion: ["deducible", "deducciones autorizadas"],
    ingreso: ["acumulable", "omision de ingresos"],
    servicios: ["servicios profesionales", "prestacion de servicios"],
    obligaciones: ["inscripcion", "rfc", "contabilidad", "comprobantes"]
};

/**
 * Expande una lista de tokens con sus sinónimos relacionados.
 */
export function expandQueryTokens(tokens: string[]): string[] {
    const expanded = new Set<string>(tokens);

    for (const token of tokens) {
        const lowered = token.toLowerCase();
        if (LEGAL_SYNONYMS[lowered]) {
            LEGAL_SYNONYMS[lowered].forEach(syn => {
                const synTokens = syn.split(" ");
                synTokens.forEach(st => expanded.add(st));
            });
        }
    }

    return Array.from(expanded);
}

/**
 * Expande una consulta normalizada con frases de sinónimos vinculados.
 */
export function expandNormalizedQuery(query: string): string[] {
    const expandedPhrases = new Set<string>();
    const normalizedQuery = normalizeQuery(query);

    for (const [key, synonyms] of Object.entries(LEGAL_SYNONYMS)) {
        if (normalizedQuery.includes(key)) {
            synonyms.forEach(syn => expandedPhrases.add(normalizeQuery(syn)));
        }
    }

    return Array.from(expandedPhrases);
}
