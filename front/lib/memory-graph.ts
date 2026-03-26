import { generateText } from "ai";
import { openaiModel } from "./openai";
import { getUserMemories, saveUserMemory } from "./user-storage";
import { generateEmbedding } from "./embedding";

/**
 * Proceso asíncrono para extraer hechos relevantes de un mensaje del usuario.
 * Se utiliza para alimentar la memoria a largo plazo del asesor.
 */
export async function extractAndStoreMemories(userId: string, userMessage: string) {
    if (!userId || userId.startsWith('anonymous-guest-') || userId === "unknown") return;

    try {
        const { text } = await generateText({
            model: openaiModel("gpt-4o-mini"),
            system: `Eres un extractor de hechos fiscales y perfiles de usuario. 
            Analiza el mensaje del usuario y extrae CUALQUIER hecho permanente relevante que sea útil para un asesor fiscal.
            EJEMPLOS: "Tiene una empresa de tecnología", "Menciona ingresos de 2M", "Le preocupa la declaración anual", "Es RESICO".
            - Devuelve solo los hechos, uno por línea.
            - Máximo 3 hechos.
            - Si el mensaje es solo un saludo o no contiene información permanente, responde con "NINGUNO".`,
            prompt: userMessage,
        });

        if (text && !text.includes("NINGUNO")) {
            const facts = text.split('\n').filter(f => f.trim().length > 5);
            for (const fact of facts) {
                const trimmedFact = fact.trim();
                let embeddingData: string | undefined = undefined;
                
                try {
                    const vector = await generateEmbedding(trimmedFact);
                    embeddingData = JSON.stringify(vector);
                } catch (err) {
                    console.error("Error generating embedding for fact:", err);
                }

                await saveUserMemory(userId, trimmedFact, embeddingData);
                console.log(`[MEMORY GRAPH] Hecho guardado para ${userId}: ${trimmedFact}`);
            }
        }
    } catch (error) {
        console.error("[MEMORY GRAPH] Error in extraction:", error);
    }
}

/**
 * Recupera hechos relevantes para inyectar en el prompt del sistema.
 */
export async function getRelevantMemoriesForPrompt(userId: string): Promise<string> {
    if (!userId || userId.startsWith('anonymous-guest-') || userId === "unknown") return "";

    try {
        const memories = await getUserMemories(userId);
        if (memories.length === 0) return "";
        
        // Por ahora usamos los 5 más recientes. 
        // En una evolución futura se podría usar búsqueda vectorial aquí.
        const facts = memories.slice(0, 5).map(m => `- ${m.factText}`).join('\n');
        return facts;
    } catch (error) {
        console.error("[MEMORY GRAPH] Error in retrieval:", error);
        return "";
    }
}
