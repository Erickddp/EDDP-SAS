import { LawArticle, StructuredIntent, QueryAnalysis } from "./types";
import { normalizeQuery, tokenizeQuery } from "./legal-search";

export interface RankedArticle {
    article: LawArticle;
    score: number;
    reasons: string[];
    isPrimary: boolean;
    role: "definition" | "procedure" | "sanction" | "correlation" | "exception";
}

export interface AuthorityRankingResult {
    primary: RankedArticle | null;
    supporting: RankedArticle[];
    rejected: RankedArticle[];
}

/**
 * Domain Priority Matrix (Step 3)
 */
const DOMAIN_PRIORITY: Record<string, string[]> = {
    "fiscal:multa": ["CFF", "LISR", "LIVA", "LIEPS"],
    "fiscal:plazo": ["CFF", "LISR", "LIVA"],
    "fiscal:calculo": ["LISR", "LIVA", "CFF"],
    "fiscal:fundamentar": ["CFF", "LA", "LIEPS"],
    "fiscal:procedimiento": ["CFF", "LFPA"],
    "fiscal:consulta": ["CFF", "LISR", "LIVA", "LA"],
    "fiscal:general": ["CFF", "LISR", "LIVA"],
    "constitucional:derechos": ["CPEUM", "LAmparo"],
    "administrativo:multa": ["CFF", "LFPA"],
    "administrativo:procedimiento": ["LFPA", "CFF"]
};

/**
 * Legal Authority Ranker (Phase 7B)
 */
export function rankLegalAuthority(
    query: string,
    intent: StructuredIntent,
    analysis: QueryAnalysis,
    articles: LawArticle[],
    history: any[] = []
): AuthorityRankingResult {
    const normalizedQuery = normalizeQuery(query);
    const tokens = tokenizeQuery(query);
    const domainKey = `${intent.legalDomain}:${intent.intentType}`;
    const priorityLaws = DOMAIN_PRIORITY[domainKey] || DOMAIN_PRIORITY[`${intent.legalDomain}:general`] || [];
    
    console.log(`[Ranker] Query: "${query}" | DomainKey: ${domainKey} | PriorityLaws: [${priorityLaws.join(", ")}] | Input: ${articles.length} arts`);

    const ranked: RankedArticle[] = articles.map(article => {
        let score = 0;
        const reasons: string[] = [];
        const normalizedText = normalizeQuery(article.text);
        const articleNumLower = article.articleNumber.toLowerCase();
        const docAbbr = article.documentAbbreviation.toUpperCase();

        // --- Positive Factors (Step 2) ---

        // 1. Exact article reference match (+100)
        const exactRefRegex = new RegExp(`\\b(art|articulo)?\\s*${articleNumLower}\\b`, 'i');
        if (exactRefRegex.test(normalizedQuery)) {
            score += 100;
            reasons.push("Coincidencia exacta de número de artículo");
        }

        // 2. Same law + direct concept match (+60)
        const isPriorityLaw = priorityLaws.includes(docAbbr);
        const hasDirectConcept = tokens.some(t => normalizedText.includes(t));
        if (isPriorityLaw && hasDirectConcept) {
            score += 60;
            reasons.push(`Ley prioritaria (${docAbbr}) con conceptos directos`);
        }

        // 3. Same law + same legal domain (+45)
        if (isPriorityLaw) {
            score += 45;
            reasons.push(`Pertenencia a ley del dominio: ${docAbbr}`);
        }

        // 4. Fracción / Inciso match (+30) - placeholder for now, Step 5 will improve this
        if (normalizedQuery.includes("fraccion") || normalizedQuery.includes("inciso")) {
            if (normalizedText.includes("fraccion") || normalizedText.includes("inciso")) {
                score += 30;
                reasons.push("Mención de fracción o inciso en consulta y texto");
            }
        }

        // 5. Article text contains core obligation/sanction/plazo term (+25)
        const coreTermsMap: Record<string, string[]> = {
            multa: ["multa", "sancion", "infraccion", "monto"],
            plazo: ["plazo", "dias", "fecha", "limite", "periodo"],
            calculo: ["calculo", "formula", "tasa", "porcentaje", "coeficiente"],
            obligaciones: ["debera", "obligado", "tendra", "requisito"]
        };
        const coreTerms = coreTermsMap[intent.intentType] || [];
        if (coreTerms.some(t => normalizedText.includes(t))) {
            score += 25;
            reasons.push(`Contiene terminología clave para: ${intent.intentType}`);
        }

        // 6. Exact authority / act requested in "fundamentar" mode (+20)
        if (intent.intentType === "fundamentar") {
            const authorityTerms = ["facultad", "autoridad", "procedimiento", "atribucion"];
            if (authorityTerms.some(t => normalizedText.includes(t))) {
                score += 20;
                reasons.push("Base procedimental de autoridad");
            }
        }

        // 7. Semantic similarity (+15)
        // (Assuming articles are already retrieved by semantic similarity, so we give a base score)
        score += 15;

        // --- Negative Factors (Step 2) ---

        // 1. Law is semantically close but legally secondary (-80)
        // Example: Using CFF for a pure LISR calculation question without procedure
        if (!isPriorityLaw && priorityLaws.length > 0) {
            score -= 80;
            reasons.push("Ley secundaria para este tipo de consulta");
        }

        // 2. Article is only definitional but question is about sanction / plazo (-60)
        const isDefinitional = normalizedText.includes("se entiende por") || normalizedText.includes("se considera") || (article.title && normalizeQuery(article.title).includes("definiciones"));
        if (isDefinitional && (intent.intentType === "multa" || intent.intentType === "plazo")) {
            score -= 60;
            reasons.push("Artículo definitorio para consulta de sanción/plazo");
        }

        // 3. Article was already used recently and is not primary now (-50)
        // (Placeholder: check history)
        if (history.some(h => h.articleId === article.id)) {
            score -= 50;
            reasons.push("Artículo mencionado recientemente");
        }

        // 4. Incorrect legal domain (-40)
        // (Handled by priorityLaws mostly, but can add specifics)

        // 5. Fragment does not directly answer the legal issue (-25)
        // (Hard to detect at this level without LLM, but can use simple check)
        const hasOutcomeInText = normalizeQuery(intent.desiredOutcome).split(" ").some(t => t.length > 3 && normalizedText.includes(t));
        if (!hasOutcomeInText) {
            score -= 25;
            reasons.push("Poca relación directa con el resultado esperado");
        }

        // Determine role
        let role: RankedArticle["role"] = "correlation";
        if (intent.intentType === "multa" && (normalizedText.includes("multa") || normalizedText.includes("sancion"))) role = "sanction";
        else if (intent.intentType === "plazo" && (normalizedText.includes("plazo") || normalizedText.includes("fecha"))) role = "procedure";
        else if (isDefinitional) role = "definition";

        return {
            article,
            score,
            reasons,
            isPrimary: false, // will set later
            role
        };
    });

    // Sort by score
    const sorted = ranked.sort((a, b) => b.score - a.score);
    
    console.log(`[Ranker] Top 3: ${sorted.slice(0, 3).map(a => `${a.article.documentAbbreviation} Art. ${a.article.articleNumber} (Score: ${a.score})`).join(" | ")}`);

    // Filter Primary, Supporting, Rejected
    const threshold = 10; // Articles below this score are likely noise
    const primaryThreshold = 60; // Need at least this to be considered primary

    const valid = sorted.filter(a => a.score >= threshold);
    const rejected = sorted.filter(a => a.score < threshold);

    let primary: RankedArticle | null = null;
    let supporting: RankedArticle[] = [];

    if (valid.length > 0) {
        // Step 4: Primary Basis Rule (Default 1)
        const first = valid[0];
        if (first.score >= primaryThreshold) {
            first.isPrimary = true;
            primary = first;
            console.log(`[Ranker] Selected Primary: ${primary.article.id} Law: ${primary.article.documentAbbreviation}`);
            supporting = valid.slice(1);
        } else {
            // If none are strong enough, we don't pick a primary but keep all as supporting
            supporting = valid;
        }
    }

    // Step 8: Strict Article Pruning
    const detail = analysis.detail;
    let maxSupporting = 2; // default for simple/detailed
    if (detail === "technical") maxSupporting = 4;
    else if (detail === "simple") maxSupporting = 1;

    supporting = supporting.slice(0, maxSupporting);

    // Secondary rejection (anything pruned from supporting goes to rejected)
    const pruned = valid.slice(1 + supporting.length);
    const finalRejected = [...rejected, ...pruned];

    return {
        primary,
        supporting,
        rejected: finalRejected
    };
}
