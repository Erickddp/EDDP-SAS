export type ChatMode = "casual" | "profesional";
export type DetailLevel = "sencilla" | "detallada" | "tecnica";

export interface QueryAnalysis {
    complexity: "simple" | "normal" | "complex";
    mode: "casual" | "professional";
    detail: "simple" | "detailed" | "technical";
    retrievalDepth: number;
    tokenLimit: number;
    detectedIntent: "multa" | "calculo" | "plazo" | "general";
}

export interface SourceReference {
    id: string;
    title: string;
    type: string;
    status: "Vigente";
    articleRef?: string;
    text?: string; // Full text of the law article
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
};

export type LawArticlePayload = LawArticle & {
    document: LawDocument;
};

export interface StructuredAnswer {
    summary: string;
    foundation: string[];
    scenarios: string[];
    consequences: string[];
    certainty: string;
    disclaimer: string;
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
    createdAt: number;
    updatedAt: number;
}

export interface UserPreferences {
    lastMode: ChatMode;
    lastDetailLevel: DetailLevel;
}

export interface HistoryMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ChatRequest {
    conversationId: string;
    message: string;
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
}
