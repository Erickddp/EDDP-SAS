"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { SectionTitle } from "../ui/section-title";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "¿De dónde saca MyFiscal la información?",
        answer: "MyFiscal utiliza una base de conocimientos actualizada con leyes federales de México, incluyendo el Código Fiscal de la Federación, Ley del ISR, Ley del IVA, y la Resolución Miscelánea Fiscal vigente."
    },
    {
        question: "¿Es seguro registrarme en la plataforma?",
        answer: "Absolutamente. Utilizamos protocolos de seguridad estándar de la industria y no compartimos tu historial de consultas con terceros. Tus datos están protegidos y cifrados."
    },
    {
        question: "¿Puedo usarlo si no soy contador?",
        answer: "Sí, MyFiscal está diseñado tanto para profesionales como para dueños de negocio. El modo de respuesta adaptable te permite recibir explicaciones sencillas o técnicas según lo necesites."
    },
    {
        question: "¿Qué diferencia hay entre la versión gratuita y la Pro?",
        answer: "La versión gratuita permite consultas rápidas y básicas. La Pro incluye análisis de jurisprudencia, exportación de reportes PDF fundamentados y un historial ilimitado de consultas para auditoría."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-20 md:py-28 relative">
            <Container>
                <SectionTitle
                    title="Preguntas frecuentes"
                    subtitle="Todo lo que necesitas saber sobre nuestra plataforma y el alcance de la herramienta."
                    className="mb-16"
                />

                <div className="mx-auto max-w-3xl space-y-4">
                    {faqs.map((faq, i) => (
                        <div 
                            key={i}
                            className="border border-border-glow rounded-xl bg-bg-sec/50 overflow-hidden transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-bg-sec transition-colors"
                            >
                                <span className="font-bold text-text-main pr-8">{faq.question}</span>
                                {openIndex === i ? (
                                    <Minus className="text-cyan-main flex-shrink-0" size={20} />
                                ) : (
                                    <Plus className="text-text-sec flex-shrink-0" size={20} />
                                )}
                            </button>
                            {openIndex === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="px-6 pb-6 text-text-sec text-sm leading-relaxed border-t border-border-glow/30 pt-4"
                                >
                                    {faq.answer}
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
