
import { z } from "zod";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

// Support standard loading
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- 1. SCHEMAS ---

export const ExtractedLawArticleSchema = z.object({
  articleNumber: z.string(),
  title: z.string().optional(),
  content: z.string(),
  status: z.enum(["Vigente", "Derogado", "Reforma Pendiente"]).default("Vigente"),
  hierarchy: z.object({
    titulo: z.string().optional(),
    capitulo: z.string().optional(),
    seccion: z.string().optional(),
  }),
  summary: z.string(),
});

export const ExtractionResultSchema = z.object({
  articles: z.array(ExtractedLawArticleSchema),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// --- 2. SYSTEM PROMPT ---

const SYSTEM_PROMPT = `
Eres un Analista Legal Senior. Tu objetivo es convertir texto legal en un JSON siguiendo exclusivamente este formato:
{
  "articles": [
    {
      "articleNumber": "string",
      "title": "optional string",
      "content": "full original text including fractions",
      "status": "Vigente" | "Derogado",
      "hierarchy": { "titulo": "string", "capitulo": "string" },
      "summary": "one sentence summary"
    }
  ]
}

REGLAS:
1. No incluyas explicaciones, solo el JSON.
2. Identifica artículos (ej: Art. 27).
3. Si dice (Derogado), marca status: "Derogado".
`;

// --- 3. PARSER ENGINE ---

export async function parseLegalText(rawText: string): Promise<ExtractionResult> {
  if (!rawText || rawText.trim().length < 10) return { articles: [] };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawText },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty OpenAI response");

    const rawJson = JSON.parse(content);
    
    // Auto-fix if LLM returns a naked array instead of an object with 'articles'
    const normalized = Array.isArray(rawJson) ? { articles: rawJson } : rawJson;

    return ExtractionResultSchema.parse(normalized);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("[PARSER ZOD ERROR]:", JSON.stringify(error.format(), null, 2));
    }
    throw new Error(`Failed to structure legal text: ${error.message}`);
  }
}
