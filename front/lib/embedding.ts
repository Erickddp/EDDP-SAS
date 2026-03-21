import { openai } from "./openai";


export async function generateEmbedding(text: string): Promise<number[]> {
    if (!openai) {
        throw new Error("Missing OPENAI_API_KEY for embedding generation.");
    }


    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });
    return response.data[0].embedding;
}
