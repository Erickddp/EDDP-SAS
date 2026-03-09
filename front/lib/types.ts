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

export interface LawDocument {
    id: string;
    name: string;
    abbreviation: string;
    source?: string;
    lastUpdate?: string;
}

export interface LawArticle {
    id: string;
    document: string;
    abbreviation: string;
    articleNumber: string;
    title: string;
    text: string;
    keywords: string[];
}

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

export interface ChatRequest {
    conversationId: string;
    message: string;
    mode: ChatMode;
    detailLevel: DetailLevel;
}

export interface ChatResponse {
    answer: StructuredAnswer;
    sources: SourceReference[];
    titleSuggestion?: string;
}
