import OpenAI from "openai";
import { CONFIG } from "./env-config";

const apiKey = CONFIG.OPENAI_API_KEY;

export const openai = apiKey 
    ? new OpenAI({ apiKey }) 
    : null;

export const OPENAI_MODEL = CONFIG.OPENAI_MODEL;
