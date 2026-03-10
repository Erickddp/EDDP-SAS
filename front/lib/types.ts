export type ChatMode = "casual" | "profesional";
export type DetailLevel = "sencilla" | "detallada" | "tecnica";

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
}
