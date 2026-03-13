import { LawArticle, StructuredIntent, StructuredFragment } from "./types";
import { normalizeQuery, tokenizeQuery } from "./legal-search";

interface ScoredBlock {
    text: string;
    score: number;
    kind: StructuredFragment["kind"];
    marker?: string;
    subsectionIndex?: number;
}

/**
 * Extracts the most relevant fragments from a LawArticle based on intent.
 */
export function extractArticleFragments(
    article: LawArticle,
    intent: StructuredIntent,
    query: string,
    limit = 2
): StructuredFragment[] {
    const blocks = parseArticleIntoBlocks(article.text);
    const queryTokens = tokenizeQuery(query);
    const normalizedQueryText = normalizeQuery(query);

    const scoredBlocks: ScoredBlock[] = blocks.map(block => {
        let score = 0;
        const normalizedBlock = normalizeQuery(block.text);

        // 0. Subsection Match (+40)
        if (block.marker && normalizedQueryText.includes(normalizeQuery(block.marker))) {
            score += 40;
        }

        // 1. Exact Entity Match (+30)
        for (const entity of intent.entities) {
            if (normalizedBlock.includes(entity)) {
                score += 30;
            }
        }

        // 2. Keyword Match (+10 per token)
        for (const token of queryTokens) {
            if (normalizedBlock.includes(token)) {
                score += 10;
            }
        }

        // 3. Intent Type Signal (+20)
        if (intent.intentType === "multa" && (normalizedBlock.includes("multa") || normalizedBlock.includes("$") || normalizedBlock.includes("sancion"))) {
            score += 25;
        }
        if (intent.intentType === "plazo" && (normalizedBlock.includes("plazo") || normalizedBlock.includes("dias") || normalizedBlock.includes("fechas"))) {
            score += 25;
        }

        return { ...block, score };
    });

    // Sort by score and take top N
    return scoredBlocks
        .filter(b => b.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(b => ({
            text: b.text,
            score: b.score,
            kind: b.kind,
            marker: b.marker,
            subsectionIndex: b.subsectionIndex,
            subsectionLabel: b.marker ? `${b.kind === "fraccion" ? "fracción" : b.kind} ${b.marker}` : undefined
        }));
}

/**
 * Simplified version of parseLegalBlocks for backend usage.
 */
function parseArticleIntoBlocks(text: string): { text: string; kind: ScoredBlock["kind"]; marker?: string; subsectionIndex?: number }[] {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const blocks: { text: string; kind: ScoredBlock["kind"]; marker?: string; subsectionIndex?: number }[] = [];

    let subsectionCounter = 0;

    for (const line of lines) {
        // Match markers like "I.", "1.", "a)", etc.
        const markerMatch = line.match(/^(?:([IVXLCDM]+\.)|(\d+\.)|([a-z]\))|([A-Z]\.-))\s+(.+)$/);
        if (markerMatch) {
            subsectionCounter++;
            const marker = markerMatch[1] || markerMatch[2] || markerMatch[3] || markerMatch[4];
            let kind: ScoredBlock["kind"] = "parrafo";
            
            if (marker.match(/[IVXLCDM]+\./)) kind = "fraccion";
            else if (marker.match(/[a-z]\)/)) kind = "inciso";
            else if (marker.match(/\d+\./)) kind = "parrafo"; // standard numbered para

            blocks.push({
                kind,
                marker,
                text: markerMatch[5],
                subsectionIndex: subsectionCounter
            });
        } else if (line.toUpperCase() === line && line.length > 5 && line.length < 100) {
            blocks.push({ kind: "heading", text: line });
        } else {
            blocks.push({ kind: "parrafo", text: line });
        }
    }

    return blocks;
}
