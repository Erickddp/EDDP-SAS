"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Card } from "../ui/card";
import { SectionTitle } from "../ui/section-title";
import { BookOpen, Scale, Clock, Users } from "lucide-react";

export function Benefits() {
    const benefits = [
        {
            title: "Respuestas más claras",
            description: "Traduce la jerga legal a términos prácticos y de negocio, adaptando el nivel de profundidad a tu perfil.",
            icon: BookOpen,
            delay: 0.1,
        },
        {
            title: "Fundamento legal visible",
            description: "Cada respuesta viene respaldada con precisión por la ley, código o reglamento vigente aplicable.",
            icon: Scale,
            delay: 0.2,
        },
        {
            title: "Ahorro de tiempo para despachos",
            description: "Agiliza drásticamente tu investigación fiscal y encuentra el artículo exacto en segundos.",
            icon: Clock,
            delay: 0.3,
        },
        {
            title: "Acceso accesible para todos",
            description: "Democratizando el conocimiento fiscal premium para emprendedores, PyMEs y contribuyentes.",
            icon: Users,
            delay: 0.4,
        },
    ];

    return (
        <section id="como-funciona" className="py-20 md:py-28 relative">
            <Container>
                <SectionTitle
                    title="Diseñado para consultar mejor"
                    subtitle="Una interfaz pensada para hacer preguntas reales, entender el fundamento y moverte más rápido entre obligaciones, artículos y criterios."
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
