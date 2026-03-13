/**
 * Legal Ingestion Library
 * Handles parsing, cleaning, and normalization of legal texts.
 */

export interface LawManifestEntry {
  id: string;
  filename: string;
  documentName: string;
  abbreviation: string;
  category: string;
  sourceType: string;
  officialSource: string;
  status: string;
  notes?: string;
}

export interface NormalizedArticle {
  id: string;
  articleNumber: string;
  title: string | null;
  text: string;
  keywords: string[];
  hash?: string; // SHA-256 for change detection
}

export interface NormalizedDocument {
  document: {
    id: string;
    filename: string;
    documentName: string;
    abbreviation: string;
    category: string;
    officialSource: string;
    status: string;
  };
  articles: NormalizedArticle[];
}

/**
 * Cleans basic OCR/PDF noise from the text.
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    // Remove redundant multiple spaces
    .replace(/[ \t]+/g, ' ')
    // Remove triple or more newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove typical page numbers or side markers (heuristic)
    // pattern: newline + digits + newline or newline + dot + digits
    .replace(/\n\d+\s*\n/g, '\n')
    .trim();
}

import crypto from 'crypto';

/**
 * Basic keyword extraction (initial version).
 */
export function extractKeywords(text: string): string {
  return "";
}

/**
 * Generates SHA-256 hash for article text to detect updates.
 */
export function generateContentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Parses legal text and splits it into articles.
 */
export function parseArticles(docId: string, text: string): NormalizedArticle[] {
  const cleanedText = cleanText(text);
  
  // Regex to detect: Artículo 1, Artículo 1o, Artículo 1-A, ARTÍCULO 1, Art. 1
  // Lookahead/behind or simple split can work, but we need the number.
  // Using a global regex to find all start positions.
  const articleRegex = /(?:^|\n)(?:Artículo|ARTÍCULO|Art\.)\s?(\d+(?:-?[A-Z])?(?:[°ºo])?)\.?/gi;
  
  const articles: NormalizedArticle[] = [];
  let match;
  const matches: { index: number, number: string, length: number }[] = [];

  while ((match = articleRegex.exec(cleanedText)) !== null) {
    matches.push({
      index: match.index,
      number: match[1],
      length: match[0].length
    });
  }

  if (matches.length === 0) {
    // If no articles found, treat the whole text as one article "0" or just return empty
    return [{
      id: `${docId}-full`,
      articleNumber: "completo",
      title: null,
      text: cleanedText,
      keywords: []
    }];
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    const start = current.index + current.length;
    const end = next ? next.index : cleanedText.length;
    
    let articleText = cleanedText.substring(start, end).trim();
    
    // Attempt to extract title from first line if it's not too long
    // Also remove optional leading spaces or formatting characters like .- 
    articleText = articleText.replace(/^[\.\- ]+/, ""); 
    const lines = articleText.split('\n');
    let title: string | null = null;
    
    // If first line exists, is short enough, and doesn't look like regular text (e.g. capitalized, or ending with dot)
    if (lines[0] && lines[0].length < 150 && (lines[0] === lines[0].toUpperCase() || lines[0].endsWith('.') || lines[0].endsWith(':'))) {
      title = lines[0].trim();
      articleText = lines.slice(1).join('\n').trim();
    }

    articles.push({
      id: `${docId}-art-${current.number.toLowerCase()}`,
      articleNumber: current.number,
      title,
      text: articleText,
      keywords: [],
      hash: generateContentHash(articleText)
    });
  }

  return articles;
}
