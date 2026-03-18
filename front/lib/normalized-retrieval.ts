import fs from "fs";
import path from "path";
import { inferLegalTopic, normalizeQuery, tokenizeQuery } from "./legal-search";
import { ParsedLegalReference } from "./law-alias";
import { LawArticle, LawArticlePayload, SourceReference } from "./types";

type NormalizedArticle = {
    id: string;
    articleNumber: string;
    title: string | null;
    text: string;
    keywords?: string[];
};

type NormalizedDocumentFile = {
    document: {
        id: string;
        documentName: string;
        abbreviation: string;
        officialSource?: string;
        status?: string;
    };
    articles: NormalizedArticle[];
};

type CorpusArticle = {
    sourceId: string;
    articleOrder: number;
    articleNumberNorm: string;
    searchBlob: string;
    record: LawArticle;
    documentStatus: string;
};

type CorpusState = {
    bySourceId: Map<string, CorpusArticle>;
    articles: CorpusArticle[];
};

const DEFAULT_SOURCE_URL = "https://www.diputados.gob.mx/LeyesBiblio/";
const OFFICIAL_PDF_BY_ABBR: Record<string, string> = {
    CPEUM: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf",
    LISR: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf",
    LIVA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf",
    CFF: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf",
    CCOM: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CCom.pdf",
    LOPDC: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LOPDC.pdf",
    LFT: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf",
    LSS: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LSS.pdf",
    CCF: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CCF.pdf",
    LGSM: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LGSM.pdf",
    LA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LAdua.pdf",
    LFPCA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPCA.pdf",
    LFPA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPA.pdf",
    LFEA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFEA.pdf",
    LIEPS: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LIEPS.pdf",
    LINFONAVIT: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LIFNVT.pdf"
};

let cachedCorpus: CorpusState | null = null;

function normalizeArticleNumber(value: string | null | undefined): string {
    if (!value) return "";
    return normalizeQuery(value).replace(/\s+/g, "").replace(/[\u00BA\u00B0]/g, "").replace(/^0+/, "");
}

export function getOfficialPdfUrl(abbreviation: string | undefined, fallback?: string): string {
    if (fallback && fallback.startsWith("http")) return fallback;
    if (!abbreviation) return DEFAULT_SOURCE_URL;
    return OFFICIAL_PDF_BY_ABBR[abbreviation.toUpperCase()] || DEFAULT_SOURCE_URL;
}

function cleanSearchText(value: string): string {
    return normalizeQuery(value)
        .replace(/\bcamara de diputados\b/g, " ")
        .replace(/\bsecretaria general\b/g, " ")
        .replace(/\bsecretaria de servicios parlamentarios\b/g, " ")
        .replace(/\bultimas? reformas? dof\b/g, " ")
        .replace(/\bultima reforma dof\b/g, " ")
        .replace(/\b\d+\s+de\s+\d+\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getNormalizedDir(): string {
    return path.join(process.cwd(), "data", "legal", "normalized");
}

function loadCorpus(): CorpusState {
    if (cachedCorpus) return cachedCorpus;

    const bySourceId = new Map<string, CorpusArticle>();
    const allArticles: CorpusArticle[] = [];
    const normalizedDir = getNormalizedDir();

    const files = fs.readdirSync(normalizedDir).filter((file) => file.endsWith(".json")).sort();

    for (const file of files) {
        const fullPath = path.join(normalizedDir, file);
        const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8")) as NormalizedDocumentFile;
        const document = parsed.document;
        const documentId = String(document.id);
        const documentAbbreviation = String(document.abbreviation || "").toUpperCase();
        const documentName = String(document.documentName || documentAbbreviation);
        const source = getOfficialPdfUrl(documentAbbreviation, document.officialSource);
        const status = String(document.status || "Vigente");

        parsed.articles.forEach((article, index) => {
            const sourceId = article.id || `norm:${documentId}:${index}`;
            const title = article.title || undefined;
            const text = String(article.text || "");
            const keywords = Array.isArray(article.keywords) ? article.keywords : [];

            const record: LawArticle = {
                id: sourceId,
                documentId,
                documentName,
                documentAbbreviation,
                articleNumber: String(article.articleNumber || ""),
                title,
                text,
                keywords,
                source
            };

            const compactKeywords = keywords.join(" ");
            const compactTitle = title || "";
            const compactText = text.slice(0, 22000);
            const searchBlob = cleanSearchText(`${compactTitle} ${compactKeywords} ${compactText}`);

            const corpusArticle: CorpusArticle = {
                sourceId,
                articleOrder: index,
                articleNumberNorm: normalizeArticleNumber(article.articleNumber),
                searchBlob,
                record,
                documentStatus: status
            };

            bySourceId.set(sourceId, corpusArticle);
            allArticles.push(corpusArticle);
        });
    }

    cachedCorpus = {
        bySourceId,
        articles: allArticles
    };
    console.log(`[Retrieval] Loaded corpus: ${allArticles.length} articles from ${files.length} laws`);

    return cachedCorpus;
}

function inferPreferredLaw(queryNorm: string, topic: string): string | null {
    if (queryNorm.includes("imss") || queryNorm.includes("seguro social") || queryNorm.includes("continuacion voluntaria")) return "LSS";
    if (queryNorm.includes("infonavit")) return "LINFONAVIT";
    if (queryNorm.includes("aduan")) return "LA";
    if (queryNorm.includes("trabajador") || queryNorm.includes("patronal")) return "LFT";

    const topicToLaw: Record<string, string> = {
        iva: "LIVA",
        isr: "LISR",
        resico: "LISR",
        declaraciones: "CFF",
        multas: "CFF",
        recargos: "CFF"
    };

    return topicToLaw[topic] || null;
}

function scoreArticle(
    article: CorpusArticle,
    queryNorm: string,
    tokens: string[],
    parsedRef?: ParsedLegalReference,
    preferredLaw?: string | null,
    excludeIds: string[] = []
): number {
    const blob = article.searchBlob;
    let score = 0;

    // ─── Step 4: Scoring Layer ──────────────────────────────────────────

    // Diversity penalty (-1 point relative to others, here -50 for our scale)
    if (excludeIds.includes(article.sourceId)) {
        score -= 50;
    }

    if (preferredLaw && article.record.documentAbbreviation === preferredLaw) {
        score += 500; // Massively prioritize preferred law if explicitly requested or inferred
    }

    const lawFilter = parsedRef?.lawAbbreviation || null;
    if (lawFilter) {
        if (article.record.documentAbbreviation === lawFilter) score += 140;
        else score -= 90;
    }

    const articleFilterNorm = normalizeArticleNumber(parsedRef?.articleNumber);
    if (articleFilterNorm) {
        if (article.articleNumberNorm === articleFilterNorm) score += 260;
        else if (blob.includes(`articulo ${articleFilterNorm}`) || blob.includes(`art ${articleFilterNorm}`)) score += 25;
    }

    if (queryNorm.includes(article.articleNumberNorm) && article.articleNumberNorm.length >= 1) {
        score += 22;
    }

    const normalizedTitle = cleanSearchText(article.record.title || "");
    const normalizedKeywords = cleanSearchText(article.record.keywords.join(" "));
    for (const token of tokens) {
        if (token === article.articleNumberNorm) score += 70;
        if (normalizedTitle.includes(token)) score += 16;
        if (normalizedKeywords.includes(token)) score += 12;
        const regex = new RegExp(`\\b${token}\\b`, 'i');
        if (regex.test(blob)) {
            score += 12; // Precise word match
        } else if (blob.includes(token)) {
            score += 4;  // Partial match (e.g. "multas" matches "multa")
        }
    }

    return score;
}

export function searchNormalizedArticles(
    query: string, 
    limit = 10, 
    parsedRef?: ParsedLegalReference,
    excludeIds: string[] = [],
    preferredLawOverride?: string | null
): LawArticle[] {
    const corpus = loadCorpus();
    const queryNorm = normalizeQuery(query);
    const tokens = tokenizeQuery(query);
    const topic = inferLegalTopic(query);
    const preferredLaw = preferredLawOverride || inferPreferredLaw(queryNorm, topic);
    const articleFilterNorm = normalizeArticleNumber(parsedRef?.articleNumber);
    const lawFilter = parsedRef?.lawAbbreviation || null;

    if (lawFilter && articleFilterNorm) {
        const exactMatches = corpus.articles.filter(
            (article) =>
                article.record.documentAbbreviation === lawFilter &&
                article.articleNumberNorm === articleFilterNorm
        );

        if (exactMatches.length > 0) {
            const relatedFromSameLaw = corpus.articles
                .filter((article) => article.record.documentAbbreviation === lawFilter && article.articleNumberNorm !== articleFilterNorm)
                .map((article) => ({
                    article,
                    score: scoreArticle(article, queryNorm, tokens, parsedRef, preferredLaw, excludeIds)
                }))
                .filter((entry) => entry.score > -100) // allow slightly negative if diversity applied
                .sort((a, b) => b.score - a.score)
                .map((entry) => entry.article);

            const selected = [...exactMatches, ...relatedFromSameLaw]
                .slice(0, Math.max(1, limit))
                .map((entry) => entry.record);

            return selected;
        }
    }

    const scored = corpus.articles
        .map((article) => ({
            article,
            score: scoreArticle(article, queryNorm, tokens, parsedRef, preferredLaw, excludeIds)
        }))
        .filter((entry) => entry.score >= -100)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
        return [];
    }

    const selected = scored.slice(0, Math.max(1, limit)).map((entry) => entry.article.record);
    return selected;
}

export function buildContextFromNormalized(
    query: string, 
    limit = 4, 
    parsedRef?: ParsedLegalReference,
    excludeIds: string[] = [],
    preferredLaw?: string | null
) {
    const topic = inferLegalTopic(query);
    const retrievedArticles = searchNormalizedArticles(query, limit, parsedRef, excludeIds, preferredLaw);

    const foundation = retrievedArticles.map((article) =>
        `${article.documentAbbreviation} Art. ${article.articleNumber}: ${article.title || "Texto aplicable al caso consultado"}.`
    );

    const sources: SourceReference[] = retrievedArticles.map((article) => ({
        id: article.id,
        title: `${article.documentAbbreviation} - Art. ${article.articleNumber}`,
        type: article.documentName,
        status: "Vigente",
        articleRef: `Art. ${article.articleNumber}`,
        text: article.text
    }));

    return {
        topic,
        retrievedArticles,
        foundation,
        sources,
        retrievalMeta: {
            strategy: "normalized-local-v1",
            totalMatches: retrievedArticles.length
        }
    };
}

export function getNormalizedArticlePayloadBySourceId(sourceId: string): LawArticlePayload | null {
    if (!sourceId.startsWith("norm:")) return null;

    const corpus = loadCorpus();
    const hit = corpus.bySourceId.get(sourceId);
    if (!hit) return null;

    const article = hit.record;

    return {
        ...article,
        document: {
            id: article.documentId,
            name: article.documentName,
            abbreviation: article.documentAbbreviation,
            source: article.source,
            lastUpdate: hit.documentStatus
        }
    };
}

