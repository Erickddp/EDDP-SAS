"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Card } from "../ui/card";
import { SectionTitle } from "../ui/section-title";
import { BookOpen, Scale, Clock, Users } from "lucide-react";

export function Benefits() {
    const benefits = [
        {
            title: "Claridad Inmediata",
            description: "Traduce la jerga legal compleja a términos prácticos de negocio sin perder el rigor técnico.",
            icon: BookOpen,
            delay: 0.1,
        },
        {
            title: "Fundamento Legal",
            description: "Cada respuesta se construye sobre leyes, reglamentos y criterios vigentes, citando fuentes exactas.",
            icon: Scale,
            delay: 0.2,
        },
        {
            title: "Rapidez Estratégica",
            description: "Reduce horas de investigación a segundos. Encuentra el artículo preciso en el momento que lo necesitas.",
            icon: Clock,
            delay: 0.3,
        },
        {
            title: "Trazabilidad Total",
            description: "Mantén un historial de tus consultas para revisiones futuras o para documentar criterios internos.",
            icon: Users,
            delay: 0.4,
        },
    ];

    return (
        <section id="beneficios" className="py-20 md:py-28 relative">
            <Container>
                <SectionTitle
                    title="Por qué elegir MyFiscal"
                    subtitle="Diseñado exclusivamente para el ecosistema fiscal mexicano, uniendo tecnología de vanguardia con sustento normativo."
                    className="mb-16"
                />

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {benefits.map((benefit, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: benefit.delay }}
                            className="h-full"
                        >
                            <Card className="flex h-full flex-col hover:border-cyan-main/40 transition-colors duration-300">
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-main/10 text-cyan-main border border-cyan-main/20">
                                    <benefit.icon size={24} />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-text-main">{benefit.title}</h3>
                                <p className="text-text-sec">{benefit.description}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
