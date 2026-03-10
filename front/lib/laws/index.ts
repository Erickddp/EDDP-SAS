import { LawArticle, LawDocument } from "../types";
import { CFF_ARTICLES } from "./cff";
import { LIVA_ARTICLES } from "./liva";
import { LISR_ARTICLES } from "./lisr";

export const ALL_LAW_ARTICLES: LawArticle[] = [
    ...CFF_ARTICLES,
    ...LIVA_ARTICLES,
    ...LISR_ARTICLES,
];

export const LAW_DOCUMENTS: LawDocument[] = [
    {
        id: "cff",
        name: "Código Fiscal de la Federación",
        abbreviation: "CFF",
        source: "Cámara de Diputados H. Congreso de la Unión",
        lastUpdate: "2024-01-01"
    },
    {
        id: "liva",
        name: "Ley del Impuesto al Valor Agregado",
        abbreviation: "LIVA",
        source: "Cámara de Diputados H. Congreso de la Unión",
        lastUpdate: "2024-01-01"
    },
    {
        id: "lisr",
        name: "Ley del Impuesto sobre la Renta",
        abbreviation: "LISR",
        source: "Cámara de Diputados H. Congreso de la Unión",
        lastUpdate: "2024-01-01"
    }
];
