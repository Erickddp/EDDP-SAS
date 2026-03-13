"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { SectionTitle } from "../ui/section-title";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { guestLogin } from "@/lib/auth";

export function PricingPreview({ hasSession = false }: { hasSession?: boolean }) {
    const plans = [
        {
            name: "Invitado",
            price: "Gratis",
            context: "Sin registro",
            description: "Prueba la potencia del buscador de forma limitada.",
            features: [
                "3 consultas diarias",
                "Respuestas básicas",
                "Acceso a leyes principales",
                "Sin historial",
            ],
            highlight: false,
            delay: 0.1,
            buttonText: "Probar ahora",
            href: "/chat",
        },
        {
            name: "Básico",
            price: "$149",
            context: "MXN / mes",
            description: "Para pequeños negocios y dueños.",
            features: [
                "Consultas detalladas",
                "Fuentes legales completas",
                "Exportar a PDF",
                "Historial de 30 días",
            ],
            highlight: true,
            delay: 0.2,
            buttonText: "Crear cuenta",
            href: "/register",
        },
        {
            name: "Pro",
            price: "$349",
            context: "MXN / mes",
            description: "Despachos y profesionales fiscales.",
            features: [
                "Consultas técnicas avanzadas",
                "Análisis de jurisprudencia",
                "Historial ilimitado",
                "Soporte prioritario",
            ],
            highlight: false,
            delay: 0.3,
            buttonText: "Comenzar Pro",
            href: "/register",
        },
        {
            name: "Despacho",
            price: "Personalizado",
            context: "Anual o mensual",
            description: "Soluciones a medida para firmas grandes.",
            features: [
                "Múltiples usuarios",
                "Análisis masivo de documentos",
                "API de integración",
                "Account Manager dedicado",
            ],
            highlight: false,
            delay: 0.4,
            buttonText: "Contactar",
            href: "/register", // Or a contact form
        },
    ];

    return (
        <section id="precios" className="relative py-20 md:py-28 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-main/5 blur-[120px] pointer-events-none" />
            <Container className="relative z-10">
                <SectionTitle
                    title="Planes de acceso"
                    subtitle="Selecciona el nivel de profundidad y herramientas que tu operación requiere."
                    className="mb-16"
                />

                <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

                                {plan.name === "Invitado" ? (
                                    hasSession ? (
                                        <Link href="/chat" className="w-full mt-auto">
                                            <Button
                                                variant="secondary"
                                                className="w-full border-border-glow hover:border-cyan-main/50"
                                            >
                                                {plan.buttonText}
                                            </Button>
                                        </Link>
                                    ) : (
                                        <form action={guestLogin} className="w-full mt-auto">
                                            <Button
                                                variant="secondary"
                                                type="submit"
                                                className="w-full border-border-glow hover:border-cyan-main/50"
                                            >
                                                {plan.buttonText}
                                            </Button>
                                        </form>
                                    )
                                ) : (
                                    <Link href={plan.href} className="w-full mt-auto">
                                        <Button
                                            variant={plan.highlight ? "primary" : "secondary"}
                                            className={cn("w-full", plan.highlight ? "" : "border-border-glow hover:border-cyan-main/50")}
                                        >
                                            {plan.buttonText}
                                        </Button>
                                    </Link>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
