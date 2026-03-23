import { ChatMode, DetailLevel, HistoryMessage, LawArticle, QueryAnalysis } from "./types";
import { ParsedLegalReference } from "./law-alias";
import { RESPONSE_SCHEMAS } from "./retrieval-config";

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
        requiredSections: ["summary", "summaryCitations", "foundation", "foundationCitations", "citations"],
        forbiddenSections: ["explanation", "explanationCitations", "example", "exampleCitations", "relatedArticles", "legalInterpretation", "scenarios", "consequences"],
        label: "SIMPLE — Respuesta mínima"
    },
    detailed: {
        minWords: 120,
        maxWords: 300,
        requiredSections: ["summary", "summaryCitations", "foundation", "foundationCitations", "explanation", "explanationCitations", "example", "exampleCitations", "scenarios", "consequences", "citations"],
        forbiddenSections: ["relatedArticles", "legalInterpretation"],
        label: "DETALLADA — Respuesta completa"
    },
    technical: {
        minWords: 301,
        maxWords: 700,
        requiredSections: ["summary", "summaryCitations", "foundation", "foundationCitations", "explanation", "explanationCitations", "example", "exampleCitations", "relatedArticles", "legalInterpretation", "scenarios", "consequences", "citations"],
        forbiddenSections: [],
        label: "TÉCNICA — Análisis exhaustivo"
    }
};

// ─── Follow-Up Compression Override ─────────────────────────────────────────

export const FOLLOW_UP_DEPTH_OVERRIDE: DepthRule = {
    maxSentences: 2,
    minWords: 10,
    maxWords: 50,
    requiredSections: ["summary", "summaryCitations", "foundation", "foundationCitations", "citations"],
    forbiddenSections: ["explanation", "explanationCitations", "example", "exampleCitations", "relatedArticles", "legalInterpretation", "scenarios", "consequences"],
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
    userContext?: { 
        name: string; 
        role: string; 
        plan?: string; 
        professionalProfile?: string | null;
        expertiseLevel?: string;
        preferredTone?: string;
        industryContext?: string | null;
        additionalContext?: string | null;
    };
}

export function buildSystemPrompt(config: PromptConfig): string {
    const { mode, topic, legalContext, queryAnalysis, isFollowUp, userContext } = config;

    const contextText = legalContext.length > 0
        ? legalContext.map((art) => {
            const fragmentsText = art.fragments && art.fragments.length > 0
                ? art.fragments.map(f => {
                    const text = typeof f === "string" ? f : f.text;
                    const label = typeof f === "object" && f.subsectionLabel ? `[${f.subsectionLabel}] ` : "";
                    return `Fragmento: ${label}"${text}"`;
                }).join("\n")
                : art.text;
            return `[ID: ${art.id}] ${art.documentAbbreviation} Art. ${art.articleNumber}: ${art.title || ""}\n${fragmentsText}`;
        }).join("\n\n")
        : "No se encontraron artículos específicos en la base de datos para esta consulta.";

    const detail = queryAnalysis?.detail || "detailed";
    const depthRule = getEffectiveDepthRule(detail, isFollowUp || false);

    // Persona Archetypes (Phase 7C)
    const persona = mode === "casual" 
        ? { title: "Tu Colega Experto", tone: "Cercano, amigable, usa analogías sencillas, es empático y brinda apoyo continuo." }
        : { title: "Socio Senior MyFiscal", tone: "Riguroso, técnico, preventivo, directo y de alta autoridad profesional." };

    const modeLabel = `${mode === "casual" ? "CASUAL" : "PROFESIONAL"} (${persona.title})`;

    const schemaMap: Record<QueryAnalysis["detail"], "simple" | "normal" | "complex"> = {
        simple: "simple",
        detailed: "normal",
        technical: "complex"
    };
    
    // Fallback to 'normal' if detail is not found in map
    const schemaKey = schemaMap[detail] || "normal";
    let rawSchema = RESPONSE_SCHEMAS[schemaKey];

    // Schema enforcement
    if (depthRule.forbiddenSections.length > 0) {
        depthRule.forbiddenSections.forEach(key => {
            const regex = new RegExp(`^.*"${key}"\\s*:.*$`, 'gm');
            rawSchema = rawSchema.replace(regex, '');
        });
        rawSchema = rawSchema.replace(/,\s*}/g, '\n}');
    }

    // Personalization Rules (Phase 7: Profiles)
    let profileInstructions = "";
    const profile = userContext?.professionalProfile?.toLowerCase() || "general";
    
    if (profile === "entrepreneur" || profile === "emprendedor") {
        profileInstructions = `
### REGLAS PARA PERFIL: EMPRENDEDOR
- LENGUAJE: Usa un lenguaje de negocios claro, evita tecnicismos innecesarios.
- ESTRUCTURA: Usa viñetas y pasos a seguir ("Action Items").
- RESUMEN: Enfócate en el "qué hacer" y el impacto financiero inmediato.
- TABLAS: Si hay cálculos, preséntalos en una tabla simple.
`;
    } else if (profile === "accountant" || profile === "contador") {
        profileInstructions = `
### REGLAS PARA PERFIL: CONTADOR
- LENGUAJE: Técnico y preciso (NIF, bases gravables, tasas).
- CITAS: Exige citas exhaustivas de fracciones e incisos. Menciona la correlación con otras leyes si aplica.
- CÁLCULOS: Desglosa la base gravable, tasa y resultado paso a paso.
- RIGOR: Prioriza la vigencia y las reglas de resolución miscelánea si los fragmentos lo permiten.
`;
    } else if (profile === "lawyer" || profile === "abogado") {
        profileInstructions = `
### REGLAS PARA PERFIL: ABOGADO
- LENGUAJE: Formal y jurídico (jurisprudencia, criterios, procedibilidad).
- ESTRUCTURA: Organiza la respuesta como un dictamen o nota técnica.
- FUNDAMENTACIÓN: Prioriza la jerarquía normativa y las facultades de la autoridad.
- DEFENSA: Menciona posibles medios de defensa si el escenario lo sugiere.
`;
    }

    let personalizationRules = "";
    if (userContext) {
        const u = userContext as any;
        const hasAdvancedPrefs = !!u.expertiseLevel;

        personalizationRules = `\n### PERSONALIZACIÓN (PHASE 10)
1. SALUDO: Saluda a ${userContext.name} de forma natural al inicio en el summary.
2. CONTEXTO PROFESIONAL: Usuario identificado como **${profile}**. ${profileInstructions}
`;

        if (hasAdvancedPrefs) {
            personalizationRules += `
3. PREFERENCIAS ESPECÍFICAS (PRIORIDAD ALTA):
   - NIVEL DE CONOCIMIENTO: ${u.expertiseLevel}. (Ajusta el rigor técnico).
   - TONO DE RESPUESTA: ${u.preferredTone}. (Sé estrictamente ${u.preferredTone}).
   - SECTOR/RÉGIMEN: ${u.industryContext || 'General'}. (Enfoca las implicaciones en este sector).
   - INFO EXTRA: ${u.additionalContext || 'N/A'}.
`;
        }
    }


    let systemInstructions = `Eres MyFiscal, un motor de razonamiento jurídico experto en leyes mexicanas (CFF, LISR, LIVA).
OBJETIVO: Responder con precisión quirúrgica, fundamentación exacta y autoridad legal.

### ESTRUCTURA DE RESPUESTA (OBLIGATORIA)
Debes organizar tu respuesta mentalmente en estas 6 secciones, aunque el JSON las separe en campos:
1. **SÍNTESIS**: Respuesta directa, clara y ultra-concisa (máximo 2 oraciones) en "summary".
2. **ANÁLISIS DEDUCTIVO**: No te limites a leer. Realiza una deducción lógica basada en los fragmentos en "explanation".
3. **INSIGHT DEDUCTIVO**: En "deductiveInsight", aporta un valor extra que no esté explícito pero sea una consecuencia legal lógica (ej: ahorros potenciales, riesgos derivados).
4. **FUNDAMENTO LEGAL**: Identificación de bases en "primaryBasis" y "supportingBasis".
5. **ESCENARIOS**: Aplicación práctica en "scenarios".
6. **PRÓXIMO PASO**: Termina con una "proactiveQuestion" que anticipe la siguiente duda lógica del usuario.
7. **CITAS TÉCNICAS**: Genera SIEMPRE un array de objetos "citations" vinculando cada ref_N con el [ID: ...] real del contexto legal proporcionado.

### PERSONALIDAD Y TONO
Tu identidad para esta consulta es: **${persona.title}**.
Tu tono debe ser: **${persona.tone}**
${personalizationRules}

### REGLAS DE AUTORIDAD (PHASE 7B)
1. SELECCIONA UNA BASE PRIMARIA: Identifica el artículo que constituye la fuente directa de la obligación o sanción. Este debe ir en "primaryBasis".
2. BASES DE APOYO: Usa artículos secundarios solo para definiciones, procedimientos o correlaciones necesarias. Van en "supportingBasis".
3. PRECISIÓN DE SECCIÓN: Si el fragmento indica una fracción o inciso, cítalo explícitamente en 'primaryBasis.subsection' y en las citas.

MODO: ${modeLabel} | DETALLE: ${depthRule.label} | TEMA: ${topic}

### REGLAS DE PROFUNDIDAD
- Longitud: MÍNIMO ${depthRule.minWords} palabras, MÁXIMO ${depthRule.maxWords} palabras.
${depthRule.maxSentences ? `- Resumen (SÍNTESIS): MÁXIMO ${depthRule.maxSentences} oraciones.\n` : ""}
- Secciones OBLIGATORIAS: [${depthRule.requiredSections.join(", ")}]
${depthRule.forbiddenSections.length > 0 ? `- Secciones PROHIBIDAS: [${depthRule.forbiddenSections.join(", ")}]\n` : "- Todas las secciones permitidas."}

CONTEXTO LEGAL (FRAGMENTOS):
${contextText}

INSTRUCCIONES CRÍTICAS:
1. RESPONDE EXCLUSIVAMENTE EN JSON utilizando este esquema riguroso:
${rawSchema}

2. "primaryBasis": Debe ser el artículo más autoritativo según el contexto legal proporcionado. Explica en "whySelected" por qué es la base principal.
3. "supportingBasis": Asigna roles claros.
4. "deductiveInsight": OBLIGATORIO. Aporta una deducción profesional que añada valor.
5. "proactiveQuestion": OBLIGATORIO. Pregunta algo inteligente que invite a seguir consultando.
6. CITA PRECISA: Cada mención legal debe usar el [ID: ...] correspondiente. Cada afirmación en summary/explanation debe tener su cita en summaryCitations/explanationCitations.
7. NO INVENTES: Si los fragmentos no contienen la respuesta, indícalo claramente en el summary.
`;

    if (isFollowUp) {
        systemInstructions += `\n!!! SEGUIMIENTO !!!\n- Responde solo al nuevo detalle.\n- Máximo 50 palabras en summary.\n- NO repitas contexto previo.`;
    }

    if (queryAnalysis?.structuredIntent?.intentType === 'fundamentar') {
        systemInstructions += `\n\n!!! MODO FUNDAMENTAR (ENFORCED) !!!
- Genera un dictamen técnico de fundamentación.
- "primaryBasis" DEBE ser la norma que faculta a la autoridad para el acto mencionado o que impone la obligación sustantiva.
- Incluye obligatoriamente el "fundamento procedimental" en supportingBasis.
- Si detectas que la fundamentación es insuficiente según los fragmentos, menciónalo en el summary.`;
    }

    if (config.retrievalStrategy === 'exact-law-article') {
        systemInstructions += `\n\n!!! MATCH EXACTO !!!\n- El usuario preguntó por un artículo específico. Ese DEBE ser tu "primaryBasis".`;
        
        if (config.parsedRef && (config.parsedRef.fractionLabel || config.parsedRef.incisoLabel)) {
            systemInstructions += `\n- Foco en: ${config.parsedRef.fractionLabel ? `Fracción ${config.parsedRef.fractionLabel}` : ""} ${config.parsedRef.incisoLabel ? `Inciso ${config.parsedRef.incisoLabel}` : ""}`;
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
