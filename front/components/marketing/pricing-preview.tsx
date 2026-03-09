"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { SectionTitle } from "../ui/section-title";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingPreview() {
    const plans = [
        {
            name: "Beta",
            price: "Gratis",
            context: "Por tiempo limitado",
            description: "Acceso temprano con funciones básicas.",
            features: ["Consultas casuales", "Respuestas simples", "1 usuario", "Soporte comunitario"],
            highlight: false,
            delay: 0.1,
        },
        {
            name: "Básico",
            price: "$149",
            context: "MXN / mes",
            description: "Para pequeños negocios y dueños.",
            features: ["Consultas detalladas", "Fuentes legales", "Exportar a PDF", "Historial de 30 días"],
            highlight: true,
            delay: 0.2,
        },
        {
            name: "Pro",
            price: "$349",
            context: "MXN / mes",
            description: "Despachos y profesionales fiscales.",
            features: ["Consultas técnicas", "Análisis de jurisprudencia", "Historial ilimitado", "Soporte prioritario"],
            highlight: false,
            delay: 0.3,
        },
    ];

    return (
        <section id="precios" className="relative py-20 md:py-28">
            <Container>
                <SectionTitle
                    title="Planes de acceso"
                    subtitle="Precios preliminares sujetos a lanzamiento. Únete a la lista de espera para asegurar tu lugar en la beta."
                    className="mb-16"
                />

                <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: plan.delay }}
                            className="relative h-full"
                        >
                            {plan.highlight && (
                                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-cyan-main/50 to-transparent opacity-50 blur-[4px]" aria-hidden="true" />
                            )}
                            <Card
                                className={cn(
                                    "relative flex h-full flex-col z-10 bg-bg-sec/90",
                                    plan.highlight ? "border-cyan-main/50 shadow-[0_0_30px_rgba(32,196,255,0.15)] md:-translate-y-4" : ""
                                )}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-main px-3 py-1 text-xs font-bold uppercase tracking-widest text-bg-main shadow-[0_0_10px_rgba(32,196,255,0.5)]">
                                        Sugerido
                                    </div>
                                )}

                                <h3 className="mb-2 mt-4 text-2xl font-bold text-text-main">{plan.name}</h3>
                                <div className="mb-1 flex items-baseline gap-2">
                                    <span className="text-4xl font-extrabold text-cyan-main">{plan.price}</span>
                                    <span className="text-sm font-medium text-text-sec">{plan.context}</span>
                                </div>
                                <p className="mb-8 text-sm text-text-sec min-h-[40px]">{plan.description}</p>

                                <ul className="mb-8 flex-1 space-y-4">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-start gap-3 text-sm text-text-sec">
                                            <Check size={18} className="text-cyan-main flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant={plan.highlight ? "primary" : "secondary"}
                                    className={cn("w-full mt-auto", plan.highlight ? "" : "border-border-glow hover:border-cyan-main/50")}
                                >
                                    Seleccionar plan
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
