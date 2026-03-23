export type ChatMode = "casual" | "profesional";
export type DetailLevel = "sencilla" | "detallada" | "tecnica";

export interface StructuredIntent {
    topic: string;
    legalDomain: "constitucional" | "fiscal" | "administrativo" | "laboral" | "otro";
    intentType: "multa" | "calculo" | "plazo" | "derechos" | "obligaciones" | "procedimiento" | "consulta" | "fundamentar";
    entities: string[];
    desiredOutcome: string;
}

export interface QueryAnalysis {
    complexity: "simple" | "normal" | "complex";
    mode: "casual" | "professional";
    detail: "simple" | "detailed" | "technical";
    retrievalDepth: number;
    tokenLimit: number;
    detectedIntent: "multa" | "calculo" | "plazo" | "general";
    structuredIntent?: StructuredIntent;
}

export interface StructuredFragment {
    text: string;
    score: number;
    kind: "article" | "fraccion" | "inciso" | "parrafo" | "heading";
    marker?: string;
    subsectionIndex?: number;
    subsectionLabel?: string;
}

export interface SourceReference {
    id: string;
    title: string;
    type: string;
    status: "Vigente";
    articleRef?: string;
    text?: string; // Full text of the law article
    fragments?: (string | StructuredFragment)[]; // Relevant snippets
}

export type LawDocument = {
    id: string;
    name: string;
    abbreviation: string;
    source: string;
    lastUpdate: string;
};

export type LawArticle = {
    id: string; // Unique ID (e.g., cff-27)
    documentId: string;
    documentName: string;
    documentAbbreviation: string;
    articleNumber: string;
    title?: string;
    text: string;
    keywords: string[];
    source: string;
    fragments?: (string | StructuredFragment)[];
};

export type LawArticlePayload = LawArticle & {
    document: LawDocument;
};

export interface FoundationEntry {
    type: "primary" | "supporting";
    ref: string;
    role?: "definition" | "procedure" | "sanction" | "correlation" | "exception";
}

export interface CitationEntry {
    ref: string;
    type: "primary" | "supporting";
    sourceId: string;
    quote: string;
    law: string;
    articleNumber: string;
    subsection?: string;
}

export interface StructuredAnswer {
    summary: string;
    summaryCitations?: string[];
    foundation: (FoundationEntry | string)[];
    foundationCitations?: string[];
    explanation?: string;
    explanationCitations?: string[];
    example?: string;
    exampleCitations?: string[];
    citations?: CitationEntry[];
    scenarios: string[];
    consequences: string[];
    certainty: string;
    disclaimer: string;
    // Phase 7B - Specific Basis
    primaryBasis?: {
        ref: string;
        law: string;
        articleNumber: string;
        subsection?: string;
        whySelected: string;
    };
    supportingBasis?: Array<{
        ref: string;
        role: "definition" | "procedure" | "sanction" | "correlation" | "exception";
    }>;
    // Phase 7C - Intelligence & Persona
    deductiveInsight?: string;
    proactiveQuestion?: string;
    // Adaptive fields (present only in complex responses)
    relatedArticles?: string[];
    legalInterpretation?: string;
    // Intent: multa
    montoMinimo?: string;
    montoMaximo?: string;
    factoresAgravantes?: string[];
    reduccion?: string | null;
    // Intent: calculo
    pasos?: string[];
    formula?: string;
    variables?: string[];
    ejemploNumerico?: string;
    // Intent: plazo
    fechaLimite?: string;
    periodicidad?: string;
    consecuenciaIncumplimiento?: string;
    prorrogas?: string | null;
}

export interface Message {
    id: string;
    conversationId: string;
    role: "user" | "assistant" | "system";
    content: string | StructuredAnswer;
    sources?: SourceReference[];
    createdAt: number;
}

export interface Conversation {
    id: string;
    title: string;
    mode: ChatMode;
    detailLevel: DetailLevel;
    archived?: boolean;
    tags?: string[];
    createdAt: number;
    updatedAt: number;
}

export interface UserPreferences {
    lastMode: ChatMode;
    lastDetailLevel: DetailLevel;
}

export interface ChatUserProfile {
    avatarUrl: string;
    googleAvatarUrl?: string | null;
}

export interface HistoryMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ChatRequest {
    conversationId: string;
    message: string;
    userId?: string; // Phase 7: Explicit ID for testing/recovery
    mode: ChatMode;
    detailLevel: DetailLevel;
    history?: HistoryMessage[];
}


export interface ChatResponse {
    answer: StructuredAnswer;
    sources: SourceReference[];
    titleSuggestion?: string;
    queryAnalysis?: QueryAnalysis;
    _debug?: AdaptiveDebugMeta;
}

export interface AdaptiveDebugMeta {
    queryDebug: {
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
    };
    retrievalRequested: number;
    retrievalReturned: number;
    topSources: string[];
    tokenLimit: number;
    promptComplexity: string;
    promptMode: string;
    promptDetail: string;
    detectedIntent: string;
    structuredIntent?: StructuredIntent;
    followUpDetected: boolean;
    followUpReason: string;
    reusedTopic: string | null;
    retrievalStrategy: string;
    depthRulesApplied: boolean;
    targetMinWords: number;
    targetMaxWords: number;
    followUpCompressionApplied: boolean;
    compressedTokenLimit: number | null;
    compressedWordLimit: number | null;
    retrievedArticlesCount: number;
    articleDiversityApplied: boolean;
    previousArticlesExcluded: number;
    responseSections?: string[];
    summaryLength?: number;
    foundationCount?: number;
    exampleIncluded?: boolean;
    citationsCount?: number;
    primaryCitationsCount?: number;
    supportingCitationsCount?: number;
    traceabilityValidated?: boolean;
    invalidCitationsRemoved?: number;
    // Phase 7B
    authorityRankingApplied: boolean;
    primaryBasisRef?: string;
    primaryBasisLaw?: string;
    primaryBasisWhy?: string;
    supportingBasisRefs?: string[];
    supportingBasisLaws?: string[];
    rejectedBasisRefs?: string[];
    mainPriorityApplied?: boolean;
    subsectionPrecisionApplied?: boolean;
    // Phase 6 Iterative
    wasIterative?: boolean;
    passCount?: number;
    iterativeTokens?: number;
    iterationTasks?: string[];
}


