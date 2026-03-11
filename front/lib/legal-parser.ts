import fs from 'fs';

export interface ParsedSection {
  type: 'paragraph' | 'fraction' | 'inciso' | 'apartado';
  label: string | null;
  text: string;
  parent?: string | null;
}

export interface ParsedArticle {
  documentName: string;
  abbreviation: string;
  articleNumber: string;
  title: string;
  content: string;
  sections: ParsedSection[];
}

export function parseLegalText(rawText: string, docName: string, abbrev: string): ParsedArticle[] {
  // Excluir toda la sección de transitorios masivos
  const mainContent = rawText.split(/T\s*R\s*A\s*N\s*S\s*I\s*T\s*O\s*R\s*I\s*O\s*S/i)[0];
  
  // Detección de "Artículo X"
  const articleRegex = /(?:ART[IÍ]CULO\s+)(\d+[A-Zo]?(?:-\w+)?)(?:[\s\.\-]+)([\s\S]*?)(?=(?:ART[IÍ]CULO\s+\d+)|$)/gi;
  
  const articles: ParsedArticle[] = [];
  let match;

  while ((match = articleRegex.exec(mainContent)) !== null) {
    const parsedNum = match[1].replace(/o$/i, ''); 
    let rawContent = match[2].trim();

    rawContent = rawContent.replace(/Decreto por el que se reforman.*/gi, '').trim();

    const sections = extractSections(rawContent);
    const content = rawContent.replace(/\s+/g, ' '); 

    articles.push({
      documentName: docName,
      abbreviation: abbrev.toUpperCase(),
      articleNumber: parsedNum,
      title: `Artículo ${parsedNum}`,
      content: content,
      sections: sections
    });
  }

  return articles;
}

export function extractSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split(/\n+/);
  
  let currentFraction: string | null = null;
  let currentApartado: string | null = null;
  
  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;

    // Apartado A, Apartado B
    const apartadoMatch = /^Apartado\s+([A-Z])[\.\-]?/i.exec(text);
    if (apartadoMatch) {
      currentApartado = apartadoMatch[1].toUpperCase();
      sections.push({ type: 'apartado', label: currentApartado, text });
      continue;
    }

    // Fracciones: "I.", "II.", "X."
    const fractionMatch = /^([IVXLCDM]+)\.-/i.exec(text) || /^([IVXLCDM]+)\./i.exec(text);
    if (fractionMatch) {
      currentFraction = fractionMatch[1].toUpperCase();
      sections.push({ type: 'fraction', label: currentFraction, text });
      continue;
    }

    // Incisos: "a)", "b)"
    const incisoMatch = /^([a-z])\)/i.exec(text);
    if (incisoMatch) {
      const incisoLabel = incisoMatch[1].toLowerCase();
      sections.push({ type: 'inciso', label: incisoLabel, text, parent: currentFraction });
      continue;
    }

    // Párrafos regulares
    sections.push({ type: 'paragraph', label: null, text });
  }

  return sections;
}
