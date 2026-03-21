import { NextResponse } from "next/server";

import { query } from "@/lib/db";
import { LawArticlePayload } from "@/lib/types";

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

export function getOfficialPdfUrl(abbreviation: string | undefined, fallback?: string): string {
    if (fallback && fallback.startsWith("http")) return fallback;
    if (!abbreviation) return DEFAULT_SOURCE_URL;
    return OFFICIAL_PDF_BY_ABBR[abbreviation.toUpperCase()] || DEFAULT_SOURCE_URL;
}

type DbArticleRow = {
    id: string;
    document_id: string | null;
    document_name: string | null;
    abbreviation: string | null;
    article_number: string | null;
    title: string | null;
    text: string | null;
    source: string | null;
    status: string | null;
    sections?: any;
};

function mapDbRowToPayload(row: DbArticleRow): LawArticlePayload {
    const abbreviation = (row.abbreviation || "N/D").toUpperCase();
    const documentId = (row.document_id || abbreviation.toLowerCase() || "legal").toString();
    const documentName = row.document_name || abbreviation;
    const source = getOfficialPdfUrl(abbreviation, row.source || undefined);
    const status = typeof row.status === "string" && row.status.trim() ? row.status : "Vigente";

    const maybeKeywords = row.sections?.keywords;
    const keywords = Array.isArray(maybeKeywords)
        ? maybeKeywords.filter((item: unknown): item is string => typeof item === "string")
        : [];

    return {
        id: row.id,
        documentId,
        documentName,
        documentAbbreviation: abbreviation,
        articleNumber: row.article_number || "N/D",
        title: row.title || undefined,
        text: row.text || "",
        keywords,
        source,
        document: {
            id: documentId,
            name: documentName,
            abbreviation,
            source,
            lastUpdate: status
        }
    };
}

async function findArticleInDb(id: string): Promise<LawArticlePayload | null> {
    try {
        // 1. Intentar búsqueda por ID exacto en la tabla de artículos principal (Fase 2)
        const { rows } = await query<DbArticleRow>(
            `SELECT
                a.id::text AS id,
                a.document_id,
                d.document_name,
                d.abbreviation,
                a.article_number,
                a.title,
                a.text,
                d.source,
                d.status,
                NULL::jsonb AS sections
             FROM articles a
             JOIN documents d ON d.id = a.document_id
             WHERE a.id = $1 OR (d.abbreviation || ':' || a.article_number) = $1
             LIMIT 1`,
            [id]
        );

        if (rows.length > 0) {
            return mapDbRowToPayload(rows[0]);
        }
    } catch (error) {
        console.warn("Article lookup on primary articles table failed:", error);
    }

    return null;
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const decodedId = decodeURIComponent(id);

        // 1. Intentar recuperación desde Base de Datos (PostgreSQL) - Prioridad Fase 2
        const dbArticle = await findArticleInDb(decodedId);
        if (dbArticle) {
            return NextResponse.json({ article: dbArticle });
        }

        // Ya no hay fallback a sistema de archivos JSON. Si no está en BD, no existe.
        return NextResponse.json(
            { error: `Articulo con ID ${decodedId} no encontrado` },
            { status: 404 }
        );
    } catch (error) {
        console.error("Article API Error:", error);
        return NextResponse.json(
            { error: "Error interno al recuperar el contenido legal" },
            { status: 500 }
        );
    }
}

