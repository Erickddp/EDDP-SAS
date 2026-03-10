import { ALL_LAW_ARTICLES } from "@/lib/laws";
import { LawArticle } from "@/lib/types";

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
    const stopwords = ["que", "como", "cuando", "donde", "porque", "para", "una", "unos", "unas", "los", "las", "del", "al", "de", "y", "en", "el", "la", "mi", "mis", "tu", "tus", "su", "sus"];
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
        obligaciones: ["obligacion", "contabilidad", "rfc", "registro", "inscripcion"]
    };

    for (const [topic, keywords] of Object.entries(mappings)) {
        if (keywords.some(kw => normalized.includes(kw))) {
            return topic;
        }
    }

    return "general";
}

/**
 * Calcula un puntaje de relevancia para un artículo basado en tokens y la query normalizada.
 */
function scoreArticle(article: LawArticle, tokens: string[], normalizedQuery: string, inferredTopic: string): number {
    let score = 0;

    // Normalizar campos del artículo para comparación
    const normalizedText = normalizeQuery(article.text);
    const normalizedTitle = normalizeQuery(article.title || "");
    const normalizedKeywords = article.keywords.map(k => normalizeQuery(k));
    const normalizedDocName = normalizeQuery(article.documentName);
    const normalizedDocAbbr = normalizeQuery(article.documentAbbreviation);
    const articleNumLower = article.articleNumber.toLowerCase();

    // 1️⃣ Mejor detección de números de artículo (+15)
    // Regex para buscar números de artículo aislados o con prefijos (ej: art 27, 113-e)
    const articleRegex = new RegExp(`\\b(art|articulo)?\\s*${articleNumLower}\\b`, 'i');
    if (articleRegex.test(normalizedQuery) || normalizedQuery.includes(articleNumLower)) {
        score += 15;
    }

    // 2️⃣ Priorizar ley correcta según tema (+8)
    const topicDocMapping: { [key: string]: string } = {
        iva: "LIVA",
        isr: "LISR",
        resico: "LISR",
        declaraciones: "CFF",
        multas: "CFF",
        comprobantes: "CFF"
    };
    if (topicDocMapping[inferredTopic] === article.documentAbbreviation) {
        score += 8;
    }

    // 3️⃣ Mejorar coincidencia semántica simple (+12)
    // Buscamos frases exactas de las keywords en la query
    for (const keyword of article.keywords) {
        const normalizedKw = normalizeQuery(keyword);
        if (normalizedKw.includes(" ") && normalizedQuery.includes(normalizedKw)) {
            score += 12;
        }
    }

    for (const token of tokens) {
        // Regla: +10 si el token coincide con una keyword normalizada
        if (normalizedKeywords.includes(token)) {
            score += 10;
        }

        // Regla: +6 si el token aparece en el texto del artículo o título
        // 4️⃣ Evitar falsos positivos: penalización si el token aparece solo una vez en texto largo (-2)
        const inText = normalizedText.includes(token);
        const inTitle = normalizedTitle.includes(token);

        if (inText || inTitle) {
            score += 6;

            if (inText && !inTitle && normalizedText.length > 200) {
                const occurrences = normalizedText.split(token).length - 1;
                if (occurrences === 1) {
                    score -= 2;

                }
            }
        }

        // Regla: +4 si el token aparece en el nombre del documento o abreviatura
        if (normalizedDocName.includes(token) || normalizedDocAbbr.includes(token)) {
            score += 4;
        }
    }

    return score;
}

/**
 * Define la prioridad de los documentos para desempates.
 */
const DOCUMENT_PRIORITY: { [key: string]: number } = {
    CFF: 1,
    LIVA: 2,
    LISR: 3
};

/**
 * Busca artículos relevantes basados en una consulta.
 */
export function searchArticles(query: string, limit = 3): LawArticle[] {
    const normalizedQuery = normalizeQuery(query);
    const tokens = tokenizeQuery(query);
    const topic = inferLegalTopic(query);

    if (tokens.length === 0 && !/\d+/.test(normalizedQuery)) {
        return [];
    }

    const scoredArticles = ALL_LAW_ARTICLES.map(article => ({
        article,
        score: scoreArticle(article, tokens, normalizedQuery, topic)
    }));

    // 6️⃣ Mejor ordenamiento final: score DESC, luego documentPriority ASC
    return scoredArticles
        .filter(item => item.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            const priorityA = DOCUMENT_PRIORITY[a.article.documentAbbreviation] || 99;
            const priorityB = DOCUMENT_PRIORITY[b.article.documentAbbreviation] || 99;
            return priorityA - priorityB;
        })
        .slice(0, limit)
        .map(item => item.article);
}

/**
 * Función de depuración para analizar el ranking de una consulta.
 */
export function debugSearch(query: string) {
    const normalizedQuery = normalizeQuery(query);
    const tokens = tokenizeQuery(query);
    const topic = inferLegalTopic(query);

    const results = ALL_LAW_ARTICLES.map(article => ({
        articleNumber: article.articleNumber,
        document: article.documentAbbreviation,
        score: scoreArticle(article, tokens, normalizedQuery, topic)
    }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score);

    return {
        query,
        normalizedQuery,
        tokens,
        topic,
        results
    };
}
