"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { SectionTitle } from "../ui/section-title";
import { MessageSquare, ShieldCheck, FileText, ArrowRight } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            title: "Haz una consulta",
            description: "Plantea tu duda fiscal en lenguaje natural, tal como se la dirías a un colega o experto.",
            icon: MessageSquare,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
        },
        {
            title: "Validación Normativa",
            description: "MyFiscal procesa la consulta y recupera el fundamento legal exacto de las leyes vigentes.",
            icon: ShieldCheck,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
        },
        {
            title: "Respuesta con Sustento",
            description: "Recibes una respuesta clara, estructurada y con los artículos citados para tu tranquilidad.",
            icon: FileText,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
        }
    ];

    return (
        <section id="como-funciona" className="py-20 md:py-28 relative overflow-hidden">
            <Container>
                <SectionTitle
                    title="¿Cómo funciona MyFiscal?"
                    subtitle="Tres pasos para transformar la incertidumbre fiscal en certeza legal."
                    className="mb-16"
                />

                <div className="relative grid gap-8 md:grid-cols-3">
                    {/* Connection lines (desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full -translate-y-12 z-0">
                        <div className="flex justify-around items-center px-12">
                            <ArrowRight className="text-border-glow animate-pulse" size={32} />
                            <ArrowRight className="text-border-glow animate-pulse" size={32} />
                        </div>
                    </div>

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative z-10 flex flex-col items-center text-center group"
                        >
                            <div className={`${step.bg} ${step.color} mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-current/20 transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-current/5`}>
                                <step.icon size={36} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-text-main group-hover:text-cyan-main transition-colors">{step.title}</h3>
                            <p className="max-w-xs text-text-sec text-sm leading-relaxed">
                                {step.description}
                            </p>
                            
                            {/* Step Number Badge */}
                            <div className="mt-4 inline-flex items-center justify-center rounded-full bg-bg-sec px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-sec border border-border-glow">
                                Paso {i + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
