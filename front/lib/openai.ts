import OpenAI from "openai";
import { createOpenAI } from "@ai-sdk/openai";
import { CONFIG } from "./env-config";

const apiKey = CONFIG.OPENAI_API_KEY;

export const openai = apiKey 
    ? new OpenAI({ apiKey }) 
    : null;

export const openaiModel = createOpenAI({
    apiKey: apiKey || "",
});

export const OPENAI_MODEL = CONFIG.OPENAI_MODEL || "gpt-4o";
