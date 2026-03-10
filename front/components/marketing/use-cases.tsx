"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { SectionTitle } from "../ui/section-title";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Briefcase, Calculator, Building2, Gavel, FileCheck } from "lucide-react";

export function UseCases() {
    const cases = [
        {
            title: "RESICO y PF con Actividad Empresarial",
            description: "Resuelve dudas sobre deducciones autorizadas, límites de ingresos y obligaciones mensuales.",
            icon: Calculator,
            tags: ["Deducciones", "Ingresos", "IVA"],
        },
        {
            title: "Cumplimiento de IVA e ISR",
            description: "Consulta tasas aplicables, momentos de causación y requisitos de acreditamiento con fundamento.",
            icon: FileCheck,
            tags: ["Acreditamiento", "Retenciones", "CFDI"],
        },
        {
            title: "Atención a Multas y Requerimientos",
            description: "Entiende el sustento legal detrás de una notificación y prepara tu respuesta con bases sólidas.",
            icon: Gavel,
            tags: ["Defensa", "Plazos", "Código Fiscal"],
        },
        {
            title: "Gestión para Despachos",
            description: "Agiliza la respuesta a clientes complejos consultando criterios y jurisprudencia en segundos.",
            icon: Building2,
            tags: ["Eficiencia", "Trazabilidad", "Expertise"],
        }
    ];

    return (
        <section className="py-20 md:py-28 bg-bg-sec/30 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-main/5 blur-[120px]" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-blue-main/5 blur-[120px]" />

            <Container className="relative z-10">
                <SectionTitle
                    title="Cobertura para cada escenario"
                    subtitle="Desde consultas cotidianas hasta análisis de situaciones críticas, MyFiscal es tu aliado estratégico."
                    className="mb-16"
                />

                <div className="grid gap-6 md:grid-cols-2">
                    {cases.map((useCase, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <Card className="h-full border-border-glow bg-bg-main/50 p-8 hover:border-cyan-main/30 hover:shadow-lg hover:shadow-cyan-main/5 transition-all duration-300">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-cyan-main/10 flex items-center justify-center text-cyan-main border border-cyan-main/20">
                                            <useCase.icon size={28} />
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {useCase.tags.map(tag => (
                                                <Badge key={tag} variant="outline" className="bg-bg-sec text-[10px] py-0 px-2 border-transparent text-text-sec">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-main mb-3">{useCase.title}</h3>
                                    <p className="text-text-sec text-sm leading-relaxed mb-6 flex-1">
                                        {useCase.description}
                                    </p>
                                    <div className="pt-4 border-t border-border-glow mt-auto">
                                        <span className="text-xs font-medium text-cyan-main flex items-center gap-1">
                                            Ejemplos de consulta <Briefcase size={12} />
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
