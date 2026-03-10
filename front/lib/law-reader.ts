import { ALL_LAW_ARTICLES, LAW_DOCUMENTS } from "./laws";
import { LawArticle, LawDocument } from "./types";

export type LawArticlePayload = LawArticle & {
    document: LawDocument;
};

/**
 * Busca un artículo por su ID único.
 */
export function getArticleById(id: string): LawArticle | null {
    return ALL_LAW_ARTICLES.find(article => article.id === id) || null;
}

/**
 * Obtiene la metadata de un documento por su ID.
 */
export function getDocumentMeta(documentId: string): LawDocument | null {
    return LAW_DOCUMENTS.find(doc => doc.id === documentId) || null;
}

/**
 * Compone el payload completo de un artículo incluyendo la metadata de su documento.
 */
export function getFullArticlePayload(id: string): LawArticlePayload | null {
    const article = getArticleById(id);
    if (!article) return null;

    const document = getDocumentMeta(article.documentId);
    if (!document) return null;

    return {
        ...article,
        document
    };
}
