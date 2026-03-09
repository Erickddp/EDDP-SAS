import { StructuredAnswer, SourceReference, ChatMode, DetailLevel } from "./types";

export interface MockKnowledgeItem {
    keywords: string[];
    theme: string;
    answers: {
        [key in ChatMode]: {
            [key in DetailLevel]: StructuredAnswer;
        }
    };
    sources: SourceReference[];
}

export const MOCK_KNOWLEDGE: MockKnowledgeItem[] = [
    {
        theme: "RESICO",
        keywords: ["resico", "confianza", "simplificado", "obligaciones resico"],
        sources: [
            { id: "1", title: "Ley del Impuesto Sobre la Renta", type: "Tíulo IV, Cap. II, Sec. IV", status: "Vigente", articleRef: "Art. 113-E al 113-J" },
            { id: "2", title: "Resolución Miscelánea Fiscal", type: "Regla 3.13", status: "Vigente" }
        ],
        answers: {
            casual: {
                sencilla: {
                    summary: "El RESICO es un régimen con tasas de impuestos muy bajas (1% al 2.5%) diseñado para que pagar sea fácil si vendes menos de 3.5 millones al año.",
                    foundation: ["Ley del ISR, artículos del Régimen de Confianza."],
                    scenarios: ["Personas físicas con actividad empresarial", "Servicios profesionales", "Arrendamiento"],
                    consequences: ["Si no pagas a tiempo, el SAT te saca del régimen y pagas más."],
                    certainty: "Alta",
                    disclaimer: "Orientación inicial demo. Verifica con un contador su aplicación a tu caso."
                },
                detallada: {
                    summary: "El Régimen Simplificado de Confianza (RESICO) busca que los contribuyentes paguen sobre sus ingresos brutos sin complicarse con tantas deducciones, siempre que no superen el límite de ingresos anuales.",
                    foundation: ["Artículos 113-E a 113-J de la LISR.", "Reglas de la RMF vigentes."],
                    scenarios: ["Aplica si tus socios no son de otras empresas", "Debes estar activo en el RFC", "No debes tener e.firma vencida"],
                    consequences: ["Perder el beneficio de las tasas bajas retroactivamente.", "Multas por falta de declaraciones mensuales."],
                    certainty: "Alta",
                    disclaimer: "Orientación inicial demo. El SAT es estricto con los requisitos de salida."
                },
                tecnica: {
                    summary: "Esquema tributario cedular de base de efectivo para PF con actividades empresariales, profesionales u otorgamiento de uso o goce temporal de bienes.",
                    foundation: ["Capítulo II, Sección IV del Título IV de la LISR.", "Cumplimiento de requisitos de los Arts. 113-E y 113-G."],
                    scenarios: ["Límite de 3.5 mdp anuales percibidos", "Restricción para socios/accionistas de PM", "Requisito de e.firma y Buzón Tributario"],
                    consequences: ["Recalculo bajo Régimen General en caso de incumplimiento de permanencia.", "Aplicación del Art. 113-I por omisión de 3 pagos."],
                    certainty: "Alta",
                    disclaimer: "Análisis conceptual basado en norma vigente. Requiere revisión de situación fiscal particular."
                }
            },
            profesional: {
                sencilla: {
                    summary: "Régimen opcional para PF con ingresos hasta 3.5 mdp con tasas reducidas del 1% al 2.5% sobre ingresos cobrados.",
                    foundation: ["Sección IV LISR.", "Art. 113-E."],
                    scenarios: ["Actividad empresarial", "Servicios profesionales", "Arrendamiento"],
                    consequences: ["Salida al Régimen General por incumplimiento."],
                    certainty: "Alta",
                    disclaimer: "Documento de orientación rápida. No sustituye consulta legal."
                },
                detallada: {
                    summary: "Esquema de simplificación administrativa y financiera basado en el flujo de efectivo, eliminando la deducción de gastos a cambio de una tasa impositiva mínima sobre ingresos brutos.",
                    foundation: ["Marco normativo: Arts. 113-E a 113-J de la LISR.", "Reglas de facilidades administrativas en RMF."],
                    scenarios: ["Compatibilidad con salarios e intereses", "Retenciones del 1.25% por personas morales", "Declaraciones mensuales y anuales obligatorias"],
                    consequences: ["Salida definitiva del régimen por omisión de 3 o más pagos mensuales.", "Imposibilidad de reingreso en ciertos supuestos."],
                    certainty: "Alta",
                    disclaimer: "Respuesta estructurada para análisis profesional. Sujeto a criterios de la autoridad."
                },
                tecnica: {
                    summary: "Determinación de ISR mediante aplicación de tarifa progresiva reducida sobre ingresos efectivamente percibidos, prescindiendo de la mecánica de deducciones autorizadas de la Sección I del Título IV.",
                    foundation: ["Art. 113-E LISR (Sujetos y Objeto)", "Art. 113-F (Anual)", "Art. 113-G (Obligaciones)", "Art. 113-I (Exclusión)"],
                    scenarios: ["Momento de acumulación: cobro efectivo", "Cómputo de ingresos anuales para permanencia", "Tratamiento de retenciones de PM según Art. 113-J"],
                    consequences: ["Actualización y recargos bajo Capítulo II Sección I.", "Restricción de beneficios fiscales del régimen ante incumplimiento del 113-G."],
                    certainty: "Muy Alta",
                    disclaimer: "Análisis técnico de carácter informativo. La interpretación de la norma corresponde a la autoridad y tribunales."
                }
            }
        }
    },
    {
        theme: "IVA",
        keywords: ["iva", "impuesto al valor agregado", "tasa 16", "iva servicios", "facturacion iva"],
        sources: [
            { id: "3", title: "Ley del Impuesto al Valor Agregado", type: "Ley Federal", status: "Vigente", articleRef: "Art. 1, 1-A" }
        ],
        answers: {
            casual: {
                sencilla: {
                    summary: "El IVA es un impuesto que se cobra por la mayoría de las ventas y servicios en México, normalmente es el 16%.",
                    foundation: ["Ley del IVA."],
                    scenarios: ["Vender productos", "Dar servicios", "Rentar locales"],
                    consequences: ["Si no lo declaras, el dinero que cobraste de IVA no es tuyo y el SAT te lo cobrará con multas."],
                    certainty: "Alta",
                    disclaimer: "Orientación inicial demo."
                },
                detallada: {
                    summary: "El IVA es un impuesto indirecto. Tú lo cobras al cliente, pero debes entregárselo al SAT cada mes, restando el IVA que tú pagaste a tus proveedores.",
                    foundation: ["Art. 1 de la LIVA.", "Art. 5 (Requisitos de acreditamiento)."],
                    scenarios: ["Tasa 16% general", "Tasa 0% (alimentos, medicinas)", "Exento (algunos servicios médicos)"],
                    consequences: ["Pagos de actualizaciones y recargos.", "Bloqueo de sellos para facturar."],
                    certainty: "Alta",
                    disclaimer: "Recuerda que el IVA se declara sobre lo efectivamente cobrado."
                },
                tecnica: {
                    summary: "El IVA es un impuesto indirecto, real y territorial con mecánica de traslación y acreditamiento basada en el flujo de efectivo.",
                    foundation: ["Arts. 1, 1-B y 5 de la LIVA.", "Reglamento de la Ley del IVA."],
                    scenarios: ["Enajenación de bienes", "Prestación de servicios independientes", "Importación", "Uso o goce temporal"],
                    consequences: ["Responsabilidad solidaria", "Improcedencia de acreditamientos por falta de requisitos de pago."],
                    certainty: "Alta",
                    disclaimer: "Análisis conceptual del impuesto al consumo."
                }
            },
            profesional: {
                sencilla: {
                    summary: "Impuesto al consumo con tasa general del 16% acumulable por flujo de efectivo.",
                    foundation: ["LIVA Art. 1."],
                    scenarios: ["Venta de bienes", "Servicios", "Arrendamiento"],
                    consequences: ["Multas por omisión de entero."],
                    certainty: "Alta",
                    disclaimer: "Uso demostrativo."
                },
                detallada: {
                    summary: "Impuesto traslativo cuyo sujeto económico es el consumidor final, pero el sujeto pasivo es el enajenante o prestador del servicio, quien debe enterar el saldo a favor o a cargo mensualmente.",
                    foundation: ["Ley del IVA y su Reglamento."],
                    scenarios: ["Retenciones por Personas Morales", "Acreditamiento de IVA de gastos", "Mecánica de flujo de efectivo"],
                    consequences: ["Determinación presuntiva por parte de la autoridad.", "Sanciones del CFF."],
                    certainty: "Alta",
                    disclaimer: "Orientación para cumplimiento fiscal."
                },
                tecnica: {
                    summary: "Contribución de carácter indirecto gravada a la enajenación, servicios, arrendamiento e importación, sujeta a acreditamiento riguroso de acuerdo con el Art. 5 de su Ley.",
                    foundation: ["Sujetos y objeto: Art. 1 LIVA", "Momento de causación: Art. 1-B", "Acreditamiento: Art. 4 y 5"],
                    scenarios: ["Tasa general, 0% y Exenciones", "Retenciones obligatorias Art. 1-A", "Proporcionalidad del IVA"],
                    consequences: ["Rechazo de saldos a favor", "Delito de defraudación en casos graves de omisión dolosa."],
                    certainty: "Muy Alta",
                    disclaimer: "Análisis técnico normativo. Requiere integración con contabilidad electrónica."
                }
            }
        }
    },
    {
        theme: "Declaraciones y Multas",
        keywords: ["declaracion", "mensual", "multa", "no presente", "omision", "recargos", "plazo"],
        sources: [
            { id: "4", title: "Código Fiscal de la Federación", type: "Norma General", status: "Vigente", articleRef: "Art. 81, 82" }
        ],
        answers: {
            casual: {
                sencilla: {
                    summary: "Si no presentas tus declaraciones a tiempo, el SAT te enviará requerimientos y te cobrará multas que pueden ser caras.",
                    foundation: ["Código Fiscal de la Federación."],
                    scenarios: ["Olvido de fecha", "Falta de dinero para pagar", "Problemas técnicos con la página"],
                    consequences: ["Multas desde $1,800 pesos", "Problemas en tu opinión de cumplimiento"],
                    certainty: "Alta",
                    disclaimer: "Orientación inicial demo."
                },
                detallada: {
                    summary: "La omisión de declaraciones es una de las faltas más comunes. Tienes hasta el día 17 del mes siguiente para declarar. Si no lo haces, pierdes beneficios como el pago en RESICO.",
                    foundation: ["Art. 81 y 82 del CFF.", "Reglas de facilidades de pago."],
                    scenarios: ["Declaración normal", "Declaración complementaria", "Opinión de cumplimiento negativa"],
                    consequences: ["Multas por cada obligación omitida.", "Suspensión de sellos digitales para facturar.", "Cobro de recargos y actualizaciones."],
                    certainty: "Alta",
                    disclaimer: "Consulta siempre tu buzón tributario."
                },
                tecnica: {
                    summary: "El incumplimiento de las obligaciones formales de presentación de declaraciones conlleva sanciones económicas tipificadas en el Código Fiscal.",
                    foundation: ["Arts. 17-H, 81 Fracc. I, y 82 Fracc. I del CFF."],
                    scenarios: ["Espontaneidad (Art. 73 CFF)", "Requerimiento de la autoridad", "Actualización y Recargos (Art. 21 CFF)"],
                    consequences: ["Restricción temporal delegada de CSD.", "Inscripción en listas del SAT.", "Multas agravadas por reincidencia."],
                    certainty: "Alta",
                    disclaimer: "Análisis normativo del cumplimiento administrativo."
                }
            },
            profesional: {
                sencilla: {
                    summary: "Incumplimiento de obligaciones de reporte que genera multas económicas inmediatas.",
                    foundation: ["CFF Art. 81."],
                    scenarios: ["Omisión mensual", "Omisión anual"],
                    consequences: ["Recargos y Opinión negativa."],
                    certainty: "Alta",
                    disclaimer: "Uso demostrativo."
                },
                detallada: {
                    summary: "La falta de presentación de declaraciones mensuales dentro de los plazos legales constituye una infracción fiscal que desata procedimientos de cobro y sanción, afectando la solvencia moral y fiscal del contribuyente.",
                    foundation: ["Marco del Código Fiscal de la Federación."],
                    scenarios: ["Multas por obligación", "Pago espontáneo vs Requerido", "Actualización de montos"],
                    consequences: ["Pérdida de subsidios o beneficios fiscales.", "Embargo precautorio en casos extremos."],
                    certainty: "Alta",
                    disclaimer: "Orientación para gestión de riesgos fiscales."
                },
                tecnica: {
                    summary: "Infracción a las facultades de comprobación y gestión de la autoridad por la omisión en la presentación de declaraciones, solicitudes o avisos en medios electrónicos.",
                    foundation: ["Infracciones: Art. 81 del CFF", "Sanciones: Art. 82 del CFF", "Condonaciones: Art. 74 del CFF"],
                    scenarios: ["Plazos de 15 días posteriores al requerimiento", "Cálculo de actualizaciones mediante INPC", "Criterios de multas mínimas y máximas"],
                    consequences: ["Caducidad de facultades", "Ejercicio de facultad de gestión (Art. 41 CFF)."],
                    certainty: "Muy Alta",
                    disclaimer: "Análisis legal de infracciones y sanciones."
                }
            }
        }
    }
];

export const DEFAULT_ANSWER: StructuredAnswer = {
    summary: "Para darte una respuesta exacta, necesito identificar el tema específico (IVA, ISR, RESICO, etc.). Sin embargo, la normativa fiscal mexicana exige el cumplimiento puntual de obligaciones para evitar sanciones.",
    foundation: ["Leyes Fiscales Mexicanas Federales."],
    scenarios: ["Consulta general sobre impuestos", "Dudas de trámites en el SAT"],
    consequences: ["Multas, recargos y actualizaciones por falta de cumplimiento."],
    certainty: "Media",
    disclaimer: "Esta es una respuesta genérica del asistente MyFiscal. Selecciona una sugerencia o detalla tu consulta."
};
