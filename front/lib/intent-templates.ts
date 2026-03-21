/**
 * Intent Templates — Phase 3
 * 
 * Defines intent-specific answer structures that change both:
 * 1. What the LLM is asked to generate (promptSuffix + schema)
 * 2. How the frontend renders the response (uiLayout)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LegalIntent = "multa" | "calculo" | "plazo" | "general";

export interface IntentTemplate {
    intent: LegalIntent;
    label: string;
    requiredFields: string[];
    optionalFields: string[];
    promptSuffix: string;
    responseSchema: string;
    uiLayout: "compact" | "steps" | "timeline" | "default";
}

// ─── Detection Keywords ─────────────────────────────────────────────────────

const INTENT_KEYWORDS: Record<Exclude<LegalIntent, "general">, string[]> = {
    multa: [
        "multa", "multado", "penalidad", "castigo", "sanción economica",
        "sancion economica", "cuánto es la multa", "cuanto es la multa",
        "monto de la multa", "rango de multa", "multa por",
        "infracción", "infraccion", "sanción", "sancion",
        "penalización", "penalizacion"
    ],
    calculo: [
        "cómo se calcula", "como se calcula", "cálculo de", "calculo de",
        "calcular", "fórmula", "formula", "paso a paso",
        "base gravable", "tasa", "porcentaje", "cuánto debo pagar",
        "cuanto debo pagar", "factor de actualización", "factor de actualizacion",
        "coeficiente", "proporción", "proporcion", "determinar",
        "cuánto es", "cuanto es", "actualización de", "actualizacion de",
        "recargos", "isr a pagar", "iva a pagar", "retención", "retencion"
    ],

    plazo: [
        "plazo", "fecha límite", "fecha limite", "vencimiento",
        "cuándo debo", "cuando debo", "cuándo se presenta", "cuando se presenta",
        "fecha de presentación", "fecha de presentacion",
        "calendario", "a más tardar", "a mas tardar", "día 17",
        "periodo", "bimestral", "mensual", "trimestral", "anual",
        "declaración anual", "declaracion anual", "pago provisional",
        "cuándo vence", "cuando vence", "cuándo aplica", "cuando aplica",
        "extemporáneo", "extemporaneo", "fuera de plazo", "fecha límite"
    ]
};

// ─── Intent Detection ───────────────────────────────────────────────────────

/**
 * Detects the legal intent from a query using keyword matching.
 * Returns "general" if no specific intent is detected.
 * If multiple intents match, picks the one with the most keyword hits.
 */
export function detectIntent(query: string): LegalIntent {
    const normalized = query.toLowerCase().trim();

    const scores: { intent: Exclude<LegalIntent, "general">; hits: number }[] = [];

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Exclude<LegalIntent, "general">, string[]][]) {
        const hits = keywords.filter(kw => normalized.includes(kw)).length;
        if (hits > 0) {
            scores.push({ intent, hits });
        }
    }

    if (scores.length === 0) return "general";

    // Return intent with most hits
    scores.sort((a, b) => b.hits - a.hits);
    return scores[0].intent;
}

// ─── Templates ──────────────────────────────────────────────────────────────

export const INTENT_TEMPLATES: Record<LegalIntent, IntentTemplate> = {
    multa: {
        intent: "multa",
        label: "Multa / Sanción",
        requiredFields: ["montoMinimo", "montoMaximo", "fundamentoLegal", "factoresAgravantes"],
        optionalFields: ["reduccion", "condonacion", "plazoCorreccion"],
        promptSuffix: `INSTRUCCIONES ESPECIALES DE INTENT "MULTA":
- Incluye el RANGO DE MULTA en pesos mexicanos (mínimo y máximo) si aplica.
- Indica claramente el artículo que funda la multa.
- Menciona factores agravantes que pueden incrementar la multa.
- Si aplica reducción por autocorrección, menciónala.
- Agrega estos campos adicionales al JSON:
  "example": "Breve ejemplo práctico numerando un caso donde aplica esta sanción.",
  "montoMinimo": "Monto mínimo de la multa en pesos (ej: $1,810.00). Pon 'No especificado' si no se puede determinar.",
  "montoMaximo": "Monto máximo de la multa en pesos (ej: $22,400.00). Pon 'No especificado' si no se puede determinar.",
  "factoresAgravantes": ["Lista de factores que podrían incrementar la sanción."],
  "reduccion": "Descripción de reducción por autocorrección si aplica, o null."`,
        responseSchema: "",  // Will be merged with complexity schema
        uiLayout: "compact"
    },
    calculo: {
        intent: "calculo",
        label: "Cálculo Fiscal",
        requiredFields: ["formula", "variables", "pasos", "ejemploNumerico"],
        optionalFields: ["factorActualizacion", "tablaReferencia"],
        promptSuffix: `INSTRUCCIONES ESPECIALES DE INTENT "CÁLCULO":
- Presenta el cálculo PASO A PASO con numeración.
- Incluye la FÓRMULA completa.
- Lista las VARIABLES necesarias para el cálculo.
- Si es posible, incluye un EJEMPLO NUMÉRICO ilustrativo.
- Agrega estos campos adicionales al JSON:
  "example": "Obligatorio: Un ejemplo numérico integrado a la situación.",
  "pasos": ["Paso 1: descripción...", "Paso 2: descripción..."],
  "formula": "Fórmula completa del cálculo.",
  "variables": ["Variable 1: descripción", "Variable 2: descripción"],
  "ejemploNumerico": "Ejemplo con números reales o hipotéticos que ilustre el cálculo."`,
        responseSchema: "",
        uiLayout: "steps"
    },
    plazo: {
        intent: "plazo",
        label: "Plazos y Fechas",
        requiredFields: ["fechaLimite", "periodicidad", "consecuenciaIncumplimiento"],
        optionalFields: ["prorrogas", "diasInhabiles"],
        promptSuffix: `INSTRUCCIONES ESPECIALES DE INTENT "PLAZO":
- Indica la FECHA LÍMITE o PERIODO específico.
- Menciona la PERIODICIDAD (mensual, bimestral, trimestral, anual).
- Explica las CONSECUENCIAS por presentación extemporánea.
- Agrega estos campos adicionales al JSON:
  "fechaLimite": "Fecha o periodo específico (ej: 'A más tardar el día 17 del mes siguiente').",
  "periodicidad": "Frecuencia: mensual, bimestral, trimestral o anual.",
  "consecuenciaIncumplimiento": "Qué pasa si no se cumple en plazo.",
  "prorrogas": "Extensiones o prórrogas posibles, o null."`,
        responseSchema: "",
        uiLayout: "timeline"
    },
    general: {
        intent: "general",
        label: "Consulta General",
        requiredFields: [],
        optionalFields: [],
        promptSuffix: "",
        responseSchema: "",
        uiLayout: "default"
    }
};

/**
 * Returns the prompt suffix for a given intent.
 * Returns empty string for "general" intent.
 */
export function getIntentPromptSuffix(intent: LegalIntent): string {
    return INTENT_TEMPLATES[intent].promptSuffix;
}

/**
 * Returns the UI layout type for a given intent.
 */
export function getIntentLayout(intent: LegalIntent): IntentTemplate["uiLayout"] {
    return INTENT_TEMPLATES[intent].uiLayout;
}
