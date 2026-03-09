"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle2 } from "lucide-react";

export function Hero() {
    const trustBullets = [
        "Modo casual y profesional",
        "Enfoque en normativa mexicana",
        "Diseñado para contadores, PyMEs y contribuyentes",
    ];

    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
            <Container className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <Badge variant="cyan" className="px-4 py-1.5 text-sm uppercase tracking-wider">
                        Asistente fiscal mexicano
                    </Badge>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6 max-w-4xl text-4xl font-extrabold tracking-tight text-text-main sm:text-5xl md:text-6xl lg:text-7xl"
                >
                    Respuestas fiscales <span className="glow-text block sm:inline">claras, rápidas</span> y con fundamento.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-10 max-w-2xl text-lg text-text-sec sm:text-xl md:text-2xl"
                >
                    MyFiscal te ayuda a consultar normas fiscales mexicanas con un lenguaje que se adapta a ti: claro para entender, técnico para trabajar.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-14 flex w-full flex-col space-y-4 sm:w-auto sm:flex-row sm:space-y-0 sm:space-x-4"
                >
                    <Button size="lg" variant="primary" className="w-full sm:w-auto text-base">
                        Probar demo
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base">
                        Ver cómo funciona
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex flex-col items-center justify-center gap-4 text-sm text-text-sec sm:flex-row sm:flex-wrap md:gap-8"
                >
                    {trustBullets.map((bullet, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-cyan-main flex-shrink-0" />
                            <span>{bullet}</span>
                        </div>
                    ))}
                </motion.div>
            </Container>
        </section>
    );
}
