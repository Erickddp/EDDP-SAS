import { StructuredIntent } from "./types";
import { LegalIntent } from "./intent-templates";

const DOMAIN_KEYWORDS: Record<StructuredIntent["legalDomain"], string[]> = {
    fiscal: ["sat", "impuesto", "isr", "iva", "ieps", "contribución", "contribucion", "rfc", "cfdi", "factura", "deduccion", "acreditamiento", "retencion", "pago", "declaracion", "declarar", "multa", "recargo", "sancion", "infraccion"],
    constitucional: ["derecho", "garantía", "garantia", "constitucion", "cpeum", "amparo", "libertad", "igualdad", "vivienda", "trabajo", "educacion", "salud"],
    administrativo: ["multa", "sancion", "procedimiento", "recurso", "impugnacion", "notificacion", "autoridad", "plazo", "vencimiento"],
    laboral: ["trabajo", "empleo", "salario", "sueldo", "patron", "obrero", "despido", "vacaciones", "aguinaldo", "utilidades", "ptu"],
    otro: []
};

const INTENT_TYPE_KEYWORDS: Record<StructuredIntent["intentType"], string[]> = {
    multa: ["multa", "sancion", "infraccion", "penalidad", "castigo"],
    calculo: ["calculo", "formula", "cuanto", "monto", "cantidad", "importe", "determinar", "base"],
    plazo: ["plazo", "fecha", "limite", "vencimiento", "cuando", "dia", "mes", "año", "vence"],
    derechos: ["derecho", "puedo", "libertad", "beneficio", "garantia"],
    obligaciones: ["debo", "obligacion", "tengo que", "requisito", "cumplir"],
    procedimiento: ["como", "pasos", "proceso", "tramite", "recurso", "impugnar"],
    consulta: ["que es", "definicion", "significado", "explica"],
    fundamentar: ["fundamentar", "fundamento", "legal", "base", "sustento", "oficio", "acta", "sat", "imss", "infonavit"]
};

/**
 * Heuristic-based structured intent extraction.
 */
export function extractStructuredIntent(query: string, detectedLegacyIntent: LegalIntent): StructuredIntent {
    const normalized = query.toLowerCase().trim();
    
    // 1. Detect Domain
    let legalDomain: StructuredIntent["legalDomain"] = "fiscal"; // Default
    let maxDomainHits = 0;
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [StructuredIntent["legalDomain"], string[]][]) {
        const hits = keywords.filter(kw => normalized.includes(kw)).length;
        if (hits > maxDomainHits) {
            maxDomainHits = hits;
            legalDomain = domain;
        }
    }

    // 2. Detect Intent Type
    let intentType: StructuredIntent["intentType"] = "consulta"; // Default

    // Check for explicit "fundamentar" first as it's a high-level specialized mode
    const fundamentarKeywords = INTENT_TYPE_KEYWORDS.fundamentar;
    const hasFundamentarKW = fundamentarKeywords.some(kw => normalized.includes(kw));

    if (hasFundamentarKW) {
        intentType = "fundamentar";
    } else if (detectedLegacyIntent === "multa") {
        intentType = "multa";
    } else if (detectedLegacyIntent === "calculo") {
        intentType = "calculo";
    } else if (detectedLegacyIntent === "plazo") {
        intentType = "plazo";
    } else {
        let maxIntentHits = 0;
        for (const [type, keywords] of Object.entries(INTENT_TYPE_KEYWORDS) as [StructuredIntent["intentType"], string[]][]) {
            if (type === "fundamentar") continue; // Already checked
            const hits = keywords.filter(kw => normalized.includes(kw)).length;
            if (hits > maxIntentHits) {
                maxIntentHits = hits;
                intentType = type;
            }
        }
    }

    // 3. Extract entities (simplified heuristic)
    const entities: string[] = [];
    const entityCandidates = ["persona", "empresa", "sat", "trabajo", "rfc", "cfdi", "isr", "iva", "resico"];
    for (const entity of entityCandidates) {
        if (normalized.includes(entity)) {
            entities.push(entity);
        }
    }

    // 4. Topic extraction (simplified)
    let topic = "consulta general";
    if (legalDomain === "constitucional") topic = "derechos constitucionales";
    else if (legalDomain === "fiscal") topic = "materia tributaria";
    else if (legalDomain === "laboral") topic = "relacion laboral";

    // 5. Outcome
    let desiredOutcome = "obtener información";
    if (intentType === "multa") desiredOutcome = "identificar montos de sancion";
    else if (intentType === "calculo") desiredOutcome = "determinar montos a pagar";
    else if (intentType === "plazo") desiredOutcome = "conocer fechas limites";
    else if (intentType === "derechos") desiredOutcome = "identificar derechos aplicables";
    else if (intentType === "fundamentar") desiredOutcome = "proporcionar fundamento legal de autoridad";

    return {
        topic,
        legalDomain,
        intentType,
        entities,
        desiredOutcome
    };
}
