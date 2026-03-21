import { z } from "zod";
import { LawArticle } from "../types";
import { searchPostgresArticles } from "../pg-retrieval";
import { openai, OPENAI_MODEL } from "../openai";


// --- 1. SCHEMAS (Structured Outputs) ---

export const SearchTaskSchema = z.object({
  query: z.string().describe("Busqueda especifica para el motor vectorial"),
  targetLaw: z.string().optional().describe("Abreviatura de la ley sugerida (ej: LISR, CFF)"),
  priority: z.enum(["high", "low"]),
  reasoning: z.string().describe("Por que esta busqueda es necesaria para responder al usuario"),
});

export const QueryDecompositionSchema = z.object({
  tasks: z.array(SearchTaskSchema).min(1).max(3),
  interdisciplinaryMatch: z.boolean().describe("Si la consulta requiere cruzar multiples fuentes legales"),
});

export const SufficiencySchema = z.object({
  isSufficient: z.boolean().describe("Si los articulos actuales bastan para una respuesta profesional y fundamentada"),
  missingConcept: z.string().optional().describe("Que falta para completar la respuesta (ej: la tasa del impuesto, el plazo de presentacion)"),
  nextStep: z.enum(["emit_answer", "second_pass"]),
});

export type SearchTask = z.infer<typeof SearchTaskSchema>;
export type QueryDecomposition = z.infer<typeof QueryDecompositionSchema>;
export type SufficiencyResult = z.infer<typeof SufficiencySchema>;

// --- 2. DECOMPOSER ENGINE ---

/**
 * Decomposes a user query into specific search tasks.
 */
export async function decomposeQuery(userQuery: string): Promise<QueryDecomposition> {
  const systemPrompt = `
    Eres un Analista Legal Senior. Tu tarea es fragmentar una pregunta fiscal compleja 
    en tareas de busqueda atomicas y precisas para un motor vectorial. 
    Analiza si la pregunta requiere cruzar leyes (ej: CFF + LISR) o si tiene multiples dimensiones (multas + plazos).
    Response estrictamente en JSON.
  `;

  if (!openai) throw new Error("OpenAI not configured.");

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });


  const content = response.choices[0].message.content;
  if (!content) throw new Error("Decomposition loop failed.");

  return QueryDecompositionSchema.parse(JSON.parse(content));
}

// --- 3. SUFFICIENCY ANALYZER ---

/**
 * Evaluates if current retrieved articles are enough to provide a high-quality answer.
 */
export async function evaluateSufficiency(
    userQuery: string, 
    articles: LawArticle[]
): Promise<SufficiencyResult> {
  const contextSummary = articles
    .map(a => `[${a.documentAbbreviation}] Art. ${a.articleNumber}: ${a.text.substring(0, 300)}...`)
    .join("\n\n");

  const systemPrompt = `
    Eres un Auditor de Calidad Juridica. Revisa si el usuario puede obtener una respuesta profesional 
    solo con los articulos proporcionados. 
    REGLA: Se binario y rapido. 
    Si falta algun fundamento clave para responder la pregunta completa, marca 'isSufficient' as false.
    Response estrictamente en JSON.
  `;

  if (!openai) throw new Error("OpenAI not configured.");

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `PREGUNTA: ${userQuery}\n\nCONTEXTO:\n${contextSummary}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });


  const content = response.choices[0].message.content;
  if (!content) throw new Error("Sufficiency loop failed.");

  return SufficiencySchema.parse(JSON.parse(content));
}

// --- 4. THE ITERATIVE ORCHESTRATOR ---

export interface IterativeRetrievalResult {
    articles: LawArticle[];
    wasIterative: boolean;
    passCount: number;
    tasks?: string[];
}


/**
 * Main engine for multi-pass RAG.
 */
export async function performIterativeRetrieval(userQuery: string): Promise<IterativeRetrievalResult> {
    const seenIds = new Set<string>();
    const finalArticles: LawArticle[] = [];

    const addUniqueArticles = (newArticles: LawArticle[]) => {
        for (const art of newArticles) {
            if (!seenIds.has(art.id)) {
                seenIds.add(art.id);
                finalArticles.push(art);
            }
        }
    };

    try {
        // ROUND 1: Decomposition & Initial Retrieval
        const decomposition = await decomposeQuery(userQuery);
        console.log(`📡 [ITERATIVE] Decomposed into ${decomposition.tasks.length} tasks.`);
        
        for (const [idx, task] of decomposition.tasks.entries()) {
            console.log(`   Task ${idx+1}: "${task.query}" (Priority: ${task.priority})`);
            const results = await searchPostgresArticles(task.query, task.priority === "high" ? 4 : 2);
            addUniqueArticles(results);
        }


        // SUFFICIENCY CHECK
        const evalResult = await evaluateSufficiency(userQuery, finalArticles);

        if (evalResult.isSufficient || evalResult.nextStep === "emit_answer") {
            return {
                articles: finalArticles,
                wasIterative: decomposition.tasks.length > 1, // It's iterative if decomposed
                passCount: 1,
                tasks: decomposition.tasks.map(t => t.query)
            };
        }



        // ROUND 2: Focused Retrieval for missing concepts
        console.log(`📡 [ITERATIVE] Round 2 Triggered. Missing: ${evalResult.missingConcept}`);
        const round2Results = await searchPostgresArticles(evalResult.missingConcept || userQuery, 3);
        addUniqueArticles(round2Results);

        return {
            articles: finalArticles,
            wasIterative: true,
            passCount: 2,
            tasks: decomposition.tasks.map(t => t.query).concat([evalResult.missingConcept || "search-2"])
        };


    } catch (error) {
        console.error("❌ [ITERATIVE ENGINE ERROR]:", error);
        // Fallback to direct retrieval if iterative fails
        return {
            articles: await searchPostgresArticles(userQuery, 5),
            wasIterative: false,
            passCount: 1
        };
    }
}
