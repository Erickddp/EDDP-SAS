/**
 * Query Analyzer — Classifies user queries by complexity to drive adaptive responses.
 * 
 * Used before retrieval to determine how many articles to fetch,
 * how deep the explanation should be, and what response schema to enforce.
 */

import { ChatMode, DetailLevel, QueryAnalysis } from "./types";
import { RETRIEVAL_CONFIG } from "./retrieval-config";
import { detectIntent, LegalIntent } from "./intent-templates";
import { extractStructuredIntent } from "./legal-intent";

// ─── Debug info interface ───────────────────────────────────────────────────

export interface QueryDebugInfo {
    wordCount: number;
    legalKeywordCount: number;
    matchedKeywords: string[];
    complexPhraseCount: number;
    matchedPhrases: string[];
    hasCalculation: boolean;
    multiLawRef: boolean;
    lawRefsFound: string[];
    hasNumbers: boolean;
    rawScore: number;
    heuristicComplexity: string;
    finalComplexity: string;
    elevatedByUser: boolean;
    detectedIntent: LegalIntent;
    structuredIntent: import("./types").StructuredIntent;
}

export interface QueryAnalysisWithDebug {
    analysis: QueryAnalysis;
    debug: QueryDebugInfo;
}

// ─── Legal keyword dictionaries ─────────────────────────────────────────────

const LEGAL_KEYWORDS = [
    "artículo", "articulo", "fracción", "fraccion", "inciso", "apartado",
    "ley", "código", "codigo", "reglamento", "decreto", "disposición",
    "lisr", "liva", "cff", "resico", "isr", "iva", "ieps", "sat",
    "contribuyente", "persona física", "persona moral", "régimen", "regimen",
    "deducción", "deduccion", "acreditamiento", "retención", "retencion",
    "obligación", "obligacion", "declaración", "declaracion", "pago provisional",
    "multa", "sanción", "sancion", "infracción", "infraccion", "recargo",
    "actualización", "actualizacion", "prescripción", "prescripcion",
    "devolución", "devolucion", "compensación", "compensacion",
    "cfdi", "factura", "comprobante", "dictamen", "auditoría", "auditoria",
    "rfc", "fiel", "e.firma", "buzón tributario", "buzon tributario"
];

const COMPLEX_PHRASES = [
    "cómo se calcula", "como se calcula",
    "cuál es el procedimiento", "cual es el procedimiento",
    "qué pasa si", "que pasa si",
    "cuándo aplica", "cuando aplica",
    "diferencia entre", "comparación", "comparacion",
    "implicaciones de", "consecuencias de",
    "cómo afecta", "como afecta",
    "análisis de", "analisis de",
    "en caso de", "supuesto de",
    "fundamento legal", "base legal",
    "interpretación", "interpretacion",
    "cálculo de", "calculo de",
    "multa y recargo", "actualización y recargo", "actualizacion y recargo",
    "diferencias en", "obligaciones de"
];


const CALCULATION_INDICATORS = [
    "calcul", "porcentaje", "%", "tasa", "cuota", "monto",
    "cantidad", "importe", "base gravable", "proporción", "proporcion",
    "factor", "coeficiente", "actualizar", "recargo"
];

// ─── Core scoring logic (shared) ────────────────────────────────────────────

function computeQueryScore(query: string) {
    const normalized = query.toLowerCase().trim();
    const words = normalized.split(/\s+/);
    const wordCount = words.length;

    const matchedKeywords = LEGAL_KEYWORDS.filter(kw => normalized.includes(kw));
    const legalKeywordCount = matchedKeywords.length;

    const matchedPhrases = COMPLEX_PHRASES.filter(p => normalized.includes(p));
    const complexPhraseCount = matchedPhrases.length;

    const hasCalculation = CALCULATION_INDICATORS.some(c => normalized.includes(c));

    const lawRefsFound = ["cff", "lisr", "liva", "lieps", "isan", "istuv"].filter(l => normalized.includes(l));
    const multiLawRef = lawRefsFound.length >= 2;

    const hasNumbers = /\d+/.test(normalized);

    let score = 0;
    if (wordCount <= 7) score -= 2;
    else if (wordCount <= 15) score += 0;
    else if (wordCount <= 25) score += 2;
    else score += 4;

    score += Math.min(legalKeywordCount, 6);
    score += complexPhraseCount * 3;
    if (hasCalculation) score += 3;
    if (lawRefsFound.length >= 2) score += 6; // Heavy weight for multi-law
    if (multiLawRef) score += 2;
    if (wordCount > 30) score += 3; // Length indicates detail
    if (hasNumbers) score += 1;



    return {
        normalized, wordCount, matchedKeywords, legalKeywordCount,
        matchedPhrases, complexPhraseCount, hasCalculation,
        lawRefsFound, multiLawRef, hasNumbers, score
    };
}

function resolveComplexityAndDetail(
    score: number,
    userMode: ChatMode,
    userDetailLevel: DetailLevel
) {
    let heuristicComplexity: QueryAnalysis["complexity"];
    if (score <= 5) heuristicComplexity = "simple";
    else if (score <= 12) heuristicComplexity = "normal"; // Lowered slightly from 14
    else heuristicComplexity = "complex";


    let complexity = heuristicComplexity;
    let elevatedByUser = false;

    if (userDetailLevel === "tecnica" && complexity === "simple") {
        complexity = "normal";
        elevatedByUser = true;
    }

    const config = RETRIEVAL_CONFIG[complexity];

    const detailMap: Record<QueryAnalysis["complexity"], QueryAnalysis["detail"]> = {
        simple: "simple",
        normal: "detailed",
        complex: "technical"
    };

    let detail = detailMap[complexity];
    if (userDetailLevel === "tecnica") detail = "technical";
    else if (userDetailLevel === "detallada") detail = "detailed";
    else if (userDetailLevel === "sencilla") detail = "simple";

    const mode: QueryAnalysis["mode"] = userMode === "profesional" ? "professional" : "casual";

    return { complexity, heuristicComplexity, elevatedByUser, config, detail, mode };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Quick classifier for production use (backward-compatible).
 */
export function analyzeQuery(
    query: string,
    userMode: ChatMode,
    userDetailLevel: DetailLevel
): QueryAnalysis {
    const { analysis } = analyzeQueryWithDebug(query, userMode, userDetailLevel);
    return analysis;
}

/**
 * Full diagnostic classifier — returns analysis + debug metadata.
 * Used by route.ts to attach _debug and by test scripts.
 */
export function analyzeQueryWithDebug(
    query: string,
    userMode: ChatMode,
    userDetailLevel: DetailLevel
): QueryAnalysisWithDebug {
    const scores = computeQueryScore(query);
    const resolved = resolveComplexityAndDetail(scores.score, userMode, userDetailLevel);

    // Detect intent
    const detectedIntent = detectIntent(query);
    const structuredIntent = extractStructuredIntent(query, detectedIntent);

    const analysis: QueryAnalysis = {
        complexity: resolved.complexity,
        mode: resolved.mode,
        detail: resolved.detail,
        retrievalDepth: resolved.config.articles,
        tokenLimit: resolved.config.tokens,
        detectedIntent,
        structuredIntent
    };

    const debug: QueryDebugInfo = {
        wordCount: scores.wordCount,
        legalKeywordCount: scores.legalKeywordCount,
        matchedKeywords: scores.matchedKeywords,
        complexPhraseCount: scores.complexPhraseCount,
        matchedPhrases: scores.matchedPhrases,
        hasCalculation: scores.hasCalculation,
        multiLawRef: scores.multiLawRef,
        lawRefsFound: scores.lawRefsFound,
        hasNumbers: scores.hasNumbers,
        rawScore: scores.score,
        heuristicComplexity: resolved.heuristicComplexity,
        finalComplexity: resolved.complexity,
        elevatedByUser: resolved.elevatedByUser,
        detectedIntent,
        structuredIntent
    };

    // Observability
    console.log(`\n┌──────── QUERY ANALYZER ────────┐`);
    console.log(`│ Score: ${scores.score} → ${resolved.heuristicComplexity}${resolved.elevatedByUser ? ` (elevated → ${resolved.complexity})` : ``}`);
    console.log(`│ Words: ${scores.wordCount} | Keywords: ${scores.legalKeywordCount} | Phrases: ${scores.complexPhraseCount}`);
    console.log(`│ Calc: ${scores.hasCalculation} | MultiLaw: ${scores.multiLawRef} | Numbers: ${scores.hasNumbers}`);
    console.log(`│ Matched KW: [${scores.matchedKeywords.slice(0, 5).join(", ")}${scores.matchedKeywords.length > 5 ? "..." : ""}]`);
    console.log(`│ Matched PH: [${scores.matchedPhrases.join(", ")}]`);
    console.log(`│ Config → articles: ${resolved.config.articles} | tokens: ${resolved.config.tokens} | detail: ${resolved.detail} | mode: ${resolved.mode}`);
    console.log(`│ Intent: ${detectedIntent} | Domain: ${structuredIntent.legalDomain} | Type: ${structuredIntent.intentType}`);
    console.log(`│ Topic: ${structuredIntent.topic} | Entities: [${structuredIntent.entities.join(", ")}]`);
    console.log(`└───────────────────────────────┘`);

    return { analysis, debug };
}
