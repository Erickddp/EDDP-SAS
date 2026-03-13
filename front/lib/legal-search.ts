/**
 * El motor de búsqueda heredado ha sido deprecado en favor de lib/normalized-retrieval.ts
 * Se conservan las utilidades de limpieza y tokenización.
 */

/**
 * Normaliza una cadena de texto eliminando acentos, caracteres especiales y convirtiendo a minúsculas.
 */
export function normalizeQuery(input: string): string {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
        .replace(/[^a-z0-9\s-]/g, "") // Elimina caracteres especiales (mantiene guiones para artículos como 113-E)
        .replace(/\s+/g, " ") // Normaliza espacios
        .trim();
}

/**
 * Divide la query en palabras y elimina palabras vacías (stopwords).
 */
export function tokenizeQuery(input: string): string[] {
    const stopwords = ["que", "como", "cuando", "donde", "porque", "para", "una", "unos", "unas", "los", "las", "del", "al", "de", "y", "en", "el", "la", "mi", "mis", "tu", "tus", "su", "sus", "por", "sobre", "con", "cual", "es", "no", "si"];
    const normalized = normalizeQuery(input);
    return normalized
        .split(" ")
        .filter(token => token.length > 1 && !stopwords.includes(token));
}

/**
 * Detecta el tema legal aproximado de una consulta.
 */
export function inferLegalTopic(query: string): string {
    const normalized = normalizeQuery(query);

    const mappings: { [key: string]: string[] } = {
        iva: ["iva", "valor agregado"],
        isr: ["isr", "renta"],
        resico: ["resico", "confianza", "simplificado"],
        declaraciones: ["declaracion", "mensual", "anual", "presentar", "pago"],
        multas: ["multa", "sancion", "infraccion", "castigo"],
        comprobantes: ["cfdi", "factura", "comprobante", "digital", "emision"],
        obligaciones: ["obligacion", "contabilidad", "rfc", "registro", "inscripcion"],
        recargos: ["recargo", "intereses moratorios", "indemnizacion"]
    };

    for (const [topic, keywords] of Object.entries(mappings)) {
        if (keywords.some(kw => normalized.includes(kw))) {
            return topic;
        }
    }

    return "general";
}
