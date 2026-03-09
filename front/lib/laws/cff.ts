import { LawArticle } from "../types";

export interface LawArticleExtended extends LawArticle {
    document: string;
    abbreviation: string;
}

export const CFF_ARTICLES: LawArticleExtended[] = [
    {
        id: "cff-27",
        document: "Código Fiscal de la Federación",
        abbreviation: "CFF",
        articleNumber: "27",
        title: "Inscripción en el RFC",
        keywords: ["rfc", "inscripcion", "registro", "padron", "contribuyentes"],
        text: "Las personas físicas y morales que deban presentar declaraciones periódicas o que estén obligadas a expedir comprobantes fiscales digitales por Internet por los actos o actividades que realicen o por los ingresos que perciban, deberán solicitar su inscripción en el registro federal de contribuyentes."
    },
    {
        id: "cff-28",
        document: "Código Fiscal de la Federación",
        abbreviation: "CFF",
        articleNumber: "28",
        title: "Obligación de llevar contabilidad",
        keywords: ["contabilidad", "registros", "sistemas", "electronica", "asientos"],
        text: "Las personas que de acuerdo con las disposiciones fiscales estén obligadas a llevar contabilidad, estarán a lo siguiente: I. La contabilidad, para efectos fiscales, se integra por los libros, sistemas y registros contables, papeles de trabajo, estados de cuenta, cuentas especiales, libros y registros sociales..."
    },
    {
        id: "cff-29",
        document: "Código Fiscal de la Federación",
        abbreviation: "CFF",
        articleNumber: "29",
        title: "Expedición de Comprobantes Fiscales (CFDI)",
        keywords: ["cfdi", "factura", "comprobante", "sello", "digital", "emision"],
        text: "Cuando las leyes fiscales establezcan la obligación de expedir comprobantes fiscales por los actos o actividades que realicen, por los ingresos que perciban o por las retenciones de contribuciones que efectúen, los contribuyentes deberán emitirlos mediante documentos digitales a través de la página de Internet del Servicio de Administración Tributaria."
    },
    {
        id: "cff-81",
        document: "Código Fiscal de la Federación",
        abbreviation: "CFF",
        articleNumber: "81",
        title: "Infracciones relacionadas con declaraciones",
        keywords: ["infraccion", "omision", "declaracion", "mensual", "anual", "plazo", "incumplimiento"],
        text: "Son infracciones relacionadas con la obligación de pago de las contribuciones; de presentar declaraciones, solicitudes, documentación, avisos, información o expedir constancias: I. No presentar las declaraciones, las solicitudes, los avisos o las constancias que exijan las disposiciones fiscales, o no hacerlo a través de los medios electrónicos que señale la Secretaría de Hacienda y Crédito Público."
    },
    {
        id: "cff-82",
        document: "Código Fiscal de la Federación",
        abbreviation: "CFF",
        articleNumber: "82",
        title: "Multas por infracciones",
        keywords: ["multa", "sancion", "monto", "pago", "cobro", "economica"],
        text: "A quien cometa las infracciones relacionadas con la obligación de presentar declaraciones, solicitudes, documentación, avisos o información a que se refiere el Artículo 81, se aplicarán las siguientes sanciones: I. Para la establecida en la fracción I: de $1,810.00 a $22,400.00 pesos por cada una de las obligaciones omitidas."
    }
];
