import { ChatMode, DetailLevel, HistoryMessage, LawArticle } from "./types";

interface PromptConfig {
    message: string;
    mode: ChatMode;
    detailLevel: DetailLevel;
    topic: string;
    legalContext: LawArticle[];
    history?: HistoryMessage[];
}

export function buildSystemPrompt(config: PromptConfig): string {
    const { mode, detailLevel, topic, legalContext } = config;

    const contextText = legalContext.length > 0 
        ? legalContext.map((art, i) => `[FUENTE ${i+1}] ${art.documentAbbreviation} Art. ${art.articleNumber}: ${art.title || ""}\n${art.text}`).join("\n\n")
        : "No se encontraron artículos específicos en la base de datos para esta consulta.";

    return `Eres MyFiscal, un asistente experto en leyes fiscales de México.
Tu objetivo es dar respuestas precisas, estructuradas y fundamentadas en el marco legal.

MODO DE RESPUESTA: ${mode === "casual" ? "Casual (amigable pero profesional)" : "Profesional (riguroso y formal)"}
NIVEL DE DETALLE: ${detailLevel}
TEMA DETECTADO: ${topic}

CONTEXTO LEGAL RECUPERADO:
${contextText}

INSTRUCCIONES CRÍTICAS:
1. RESPONDE EXCLUSIVAMENTE EN JSON.
2. NO INVENTES leyes ni artículos. Si el contexto no contiene la respuesta, admítelo basándote en la información general pero advirtiendo la falta de fundamento específico.
3. El JSON debe tener esta estructura exacta:
{
  "summary": "Resumen ejecutivo de la respuesta (1-3 frases).",
  "foundation": ["Lista de artículos específicos que sustentan la respuesta (ej: LISR Art. 113-E)."],
  "scenarios": ["Casos en los que aplica o requisitos clave."],
  "consequences": ["Riesgos, multas o consecuencias de no cumplir."],
  "certainty": "Nivel de certeza (ej: Alta, Media, Baja)",
  "disclaimer": "Nota breve aclaratoria."
}

4. Respeta el NIVEL DE DETALLE:
   - sencilla: Directa al grano.
   - detallada: Explicación clara de procesos.
   - tecnica: Lenguaje jurídico preciso y análisis de implicaciones.

5. IDIOMA: Español de México.
6. AVISO: Recuerda siempre incluir que esto es orientación y no sustituye asesoría profesional.`;
}

export function buildUserPrompt(config: PromptConfig): string {
    const { message, history } = config;
    
    let prompt = "";
    if (history && history.length > 0) {
        prompt += "HISTORIAL RECIENTE:\n";
        prompt += history.map(h => `${h.role === "user" ? "Usuario" : "Asistente"}: ${h.content}`).join("\n");
        prompt += "\n\n";
    }

    prompt += `CONSULTA ACTUAL DEL USUARIO: ${message}`;
    return prompt;
}
