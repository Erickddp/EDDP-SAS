import { ChatMode, DetailLevel, HistoryMessage, LawArticle } from "./types";
import { ParsedLegalReference } from "./law-alias";

interface PromptConfig {
    message: string;
    mode: ChatMode;
    detailLevel: DetailLevel;
    topic: string;
    legalContext: LawArticle[];
    history?: HistoryMessage[];
    retrievalStrategy?: string;
    parsedRef?: ParsedLegalReference;
}

export function buildSystemPrompt(config: PromptConfig): string {
    const { mode, detailLevel, topic, legalContext } = config;

    const contextText = legalContext.length > 0 
        ? legalContext.map((art, i) => `[FUENTE ${i+1}] ${art.documentAbbreviation} Art. ${art.articleNumber}: ${art.title || ""}\n${art.text}`).join("\n\n")
        : "No se encontraron artículos específicos en la base de datos para esta consulta.";

    let systemInstructions = `Eres MyFiscal, un asistente experto en leyes fiscales de México.
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

    // CONDICIONAL PARA FORZAR EXPLOTACIÓN DE EXACT MATCH
    if (config.retrievalStrategy === 'exact-law-article') {
        systemInstructions += `\n\n!!! REGLAS DE MATCH EXACTO (CRÍTICO) !!!
- YA SE HA RECUPERADO EL ARTÍCULO EXACTO DE LA BASE DE DATOS COMO [FUENTE].
- DEBES GARANTIZAR QUE LA RESPUESTA EXPLICA EL CONTENIDO DE ESAS FUENTES.
- NO digas que te falta contexto o que necesitas identificar un tema.
- NO des respuestas genéricas. Sintetiza directamente el artículo y su utilidad.
- Cita clara y explícitamente la abreviatura y número del artículo recuperado en tu explicación y en 'foundation'.
- Bloqueo Activo: JAMÁS respondas 'no tengo suficiente información' o 'consulta general de impuestos' si el contexto tiene artículos proveídos.`;

        if (config.parsedRef && (config.parsedRef.fractionLabel || config.parsedRef.incisoLabel || config.parsedRef.apartadoLabel)) {
            const sections: string[] = [];
            if (config.parsedRef.fractionLabel) sections.push(`Fracción ${config.parsedRef.fractionLabel}`);
            if (config.parsedRef.incisoLabel) sections.push(`Inciso ${config.parsedRef.incisoLabel}`);
            if (config.parsedRef.apartadoLabel) sections.push(`Apartado ${config.parsedRef.apartadoLabel}`);
            
            systemInstructions += `\n\n!!! FOCO EN SECCIÓN ESPECÍFICA !!!
- El usuario solicitó analizar explícitamente: ${sections.join(", ")}.
- Haz foco absoluto en la sección mencionada.
- Extrae la información específica de esta sección del texto proveído y priorízala en tu 'summary' y 'foundation'.`;
        }
    }

    return systemInstructions;
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
