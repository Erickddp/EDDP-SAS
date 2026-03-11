import { ChatMode, DetailLevel, HistoryMessage, LawArticle, QueryAnalysis } from "./types";
import { ParsedLegalReference } from "./law-alias";
import { RETRIEVAL_CONFIG, RESPONSE_SCHEMAS } from "./retrieval-config";
import { getIntentPromptSuffix } from "./intent-templates";

// ─── Depth Rules ────────────────────────────────────────────────────────────

export interface DepthRule {
    maxSentences?: number;
    minWords: number;
    maxWords: number;
    requiredSections: string[];
    forbiddenSections: string[];
    label: string;
}

export const DEPTH_RULES: Record<QueryAnalysis["detail"], DepthRule> = {
    simple: {
        maxSentences: 3,
        minWords: 15,
        maxWords: 80,
        requiredSections: ["summary", "foundation"],
        forbiddenSections: ["relatedArticles", "legalInterpretation"],
        label: "SIMPLE — Respuesta mínima"
    },
    detailed: {
        minWords: 120,
        maxWords: 300,
        requiredSections: ["summary", "foundation", "scenarios", "consequences"],
        forbiddenSections: [],
        label: "DETALLADA — Respuesta completa"
    },
    technical: {
        minWords: 301,
        maxWords: 700,
        requiredSections: ["summary", "foundation", "relatedArticles", "legalInterpretation", "scenarios", "consequences"],
        forbiddenSections: [],
        label: "TÉCNICA — Análisis exhaustivo"
    }
};

// ─── Follow-Up Compression Override ─────────────────────────────────────────

export const FOLLOW_UP_DEPTH_OVERRIDE: DepthRule = {
    maxSentences: 2,
    minWords: 10,
    maxWords: 50,
    requiredSections: ["summary", "foundation"],
    forbiddenSections: ["relatedArticles", "legalInterpretation", "scenarios", "consequences"],
    label: "FOLLOW-UP — Respuesta comprimida"
};

/** Token multiplier for follow-up compression */
export const FOLLOW_UP_TOKEN_MULTIPLIER = 0.5;

/**
 * Returns the base depth rule for a given detail level.
 */
export function getDepthRules(detail: QueryAnalysis["detail"]): DepthRule {
    return DEPTH_RULES[detail];
}

/**
 * Returns the effective depth rule, considering follow-up compression.
 * Used by route.ts for debug metadata and by test scripts.
 */
export function getEffectiveDepthRule(detail: QueryAnalysis["detail"], isFollowUp: boolean): DepthRule {
    if (isFollowUp) return FOLLOW_UP_DEPTH_OVERRIDE;
    return DEPTH_RULES[detail];
}

interface PromptConfig {
    message: string;
    mode: ChatMode;
    detailLevel: DetailLevel;
    topic: string;
    legalContext: LawArticle[];
    history?: HistoryMessage[];
    retrievalStrategy?: string;
    parsedRef?: ParsedLegalReference;
    queryAnalysis?: QueryAnalysis;
    isFollowUp?: boolean;
    previousTopic?: string;
}

export function buildSystemPrompt(config: PromptConfig): string {
    const { mode, detailLevel, topic, legalContext, queryAnalysis } = config;

    const contextText = legalContext.length > 0 
        ? legalContext.map((art, i) => `[FUENTE ${i+1}] ${art.documentAbbreviation} Art. ${art.articleNumber}: ${art.title || ""}\n${art.text}`).join("\n\n")
        : "No se encontraron artículos específicos en la base de datos para esta consulta.";

    // ─── Adaptive complexity instructions ────────────────────────────────
    const complexity = queryAnalysis?.complexity || "normal";
    const tierConfig = RETRIEVAL_CONFIG[complexity];
    const responseSchema = RESPONSE_SCHEMAS[complexity];

    const modeLabel = mode === "casual" 
        ? `Casual — Amigable pero profesional.
  - Usa "tú" para dirigirte al usuario.
  - Lenguaje cotidiano, directo y sin jerga legal innecesaria.
  - Explica conceptos técnicos en términos sencillos.
  - Tono cercano, como un colega que te ayuda.`
        : `Profesional — Riguroso y formal.
  - Usa "usted" para dirigirte al usuario.
  - Lenguaje jurídico formal con terminología precisa.
  - Incluye citas textuales de artículos cuando sea posible.
  - Estructura de dictamen: objetivo, análisis, conclusión.
  - Tono de asesor fiscal certificado.`;

    // Build depth-specific behavioral instructions
    let depthInstructions = "";
    switch (complexity) {
        case "simple":
            depthInstructions = `PROFUNDIDAD: SIMPLE
- Responde de forma directa y concisa en MÁXIMO 2 frases.
- Solo incluye el artículo principal como fundamento.
- No incluyas escenarios, consecuencias ni análisis extenso.
- Lenguaje claro y accesible.`;
            break;
        case "normal":
            depthInstructions = `PROFUNDIDAD: NORMAL
- Explica paso a paso con claridad.
- Incluye los artículos relevantes como fundamento.
- Menciona escenarios donde aplica y consecuencias principales.
- Lenguaje profesional pero accesible.`;
            break;
        case "complex":
            depthInstructions = `PROFUNDIDAD: TÉCNICA / COMPLEJA
- Realiza un análisis jurídico completo y exhaustivo.
- Incluye todos los artículos relevantes, incluyendo de leyes relacionadas.
- Proporciona interpretación legal detallada.
- Describe múltiples escenarios posibles con condiciones específicas.
- Detalla consecuencias legales, multas, recargos y riesgos.
- Usa lenguaje jurídico preciso y riguroso.
- Incluye nivel de certeza fundamentado.`;
            break;
    }

    let systemInstructions = `Eres MyFiscal, un asistente experto en leyes fiscales de México.
Tu objetivo es dar respuestas precisas, estructuradas y fundamentadas en el marco legal.

MODO DE RESPUESTA: ${modeLabel}
NIVEL DE DETALLE: ${detailLevel}
TEMA DETECTADO: ${topic}

${depthInstructions}

CONTEXTO LEGAL RECUPERADO:
${contextText}

INSTRUCCIONES CRÍTICAS:
1. RESPONDE EXCLUSIVAMENTE EN JSON con esta estructura exacta:
${responseSchema}

2. NO INVENTES leyes ni artículos. Si el contexto no contiene la respuesta, admítelo basándote en la información general pero advirtiendo la falta de fundamento específico.

3. Limita tu respuesta a aproximadamente ${tierConfig.tokens} tokens.

4. IDIOMA: Español de México.
5. AVISO: Recuerda siempre incluir que esto es orientación y no sustituye asesoría profesional.`;

    // ─── Depth enforcement (with follow-up compression) ────────────────
    const effectiveDetail = queryAnalysis?.detail || "detailed";
    const isFollowUp = config.isFollowUp || false;
    const depthRule = getEffectiveDepthRule(effectiveDetail, isFollowUp);

    if (isFollowUp) {
        // Follow-up compression block — comes BEFORE normal depth rules
        systemInstructions += `\n\n!!! PREGUNTA DE SEGUIMIENTO DETECTADA (CRÍTICO) !!!
El usuario está haciendo una CONTINUACIÓN del tema anterior${config.previousTopic ? `: "${config.previousTopic}"` : ""}.
Responde ÚNICAMENTE al nuevo detalle solicitado.

REGLAS DE COMPRESIÓN (OBLIGATORIO):
- MÁXIMO 2 oraciones.
- MÁXIMO 50 palabras en el "summary".
- NO repitas explicaciones anteriores.
- NO restablezcas el contexto legal ya explicado.
- Da el dato puntual que se pide (monto, fecha, plazo, cálculo, etc.).
- Secciones PERMITIDAS en JSON: summary, foundation.
- Secciones PROHIBIDAS (array vacío o string vacío): relatedArticles, legalInterpretation, scenarios, consequences.
- Los arrays de secciones prohibidas DEBEN ser arrays vacíos [].`;
    } else {
        // Normal depth enforcement
        systemInstructions += `\n\n!!! REGLAS DE PROFUNDIDAD (OBLIGATORIO) !!!
NIVEL: ${depthRule.label}
- Tu respuesta en el campo "summary" DEBE tener entre ${depthRule.minWords} y ${depthRule.maxWords} palabras.${depthRule.maxSentences ? `\n- MÁXIMO ${depthRule.maxSentences} oraciones en el summary.` : ""}
- Secciones OBLIGATORIAS en el JSON: ${depthRule.requiredSections.join(", ")}.
${depthRule.forbiddenSections.length > 0 ? `- Secciones PROHIBIDAS (déjalas como array vacío o string vacío): ${depthRule.forbiddenSections.join(", ")}.` : "- Todas las secciones son permitidas."}
- Los arrays de secciones NO requeridas deben ser arrays vacíos [].`;
    }

    // ─── Intent-specific suffix (skip for compressed follow-ups) ─────────
    if (!isFollowUp) {
        const intent = queryAnalysis?.detectedIntent || "general";
        const intentSuffix = getIntentPromptSuffix(intent);
        if (intentSuffix) {
            systemInstructions += `\n\n${intentSuffix}`;
        }
    }

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
