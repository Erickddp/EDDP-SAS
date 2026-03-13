"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "../layout/container";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle2 } from "lucide-react";

import { guestLogin } from "@/lib/auth";
import type { UserSession } from "@/lib/user-storage";

interface HeroProps {
    user?: UserSession | null;
    forceGuestView?: boolean;
    hasSession?: boolean;
}

export function Hero({ user, forceGuestView = false, hasSession = false }: HeroProps) {
    const showAuthenticatedCta = Boolean(user) && !forceGuestView;
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
                    Inteligencia Fiscal con <span className="glow-text block sm:inline">sustento legal</span> en segundos.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-10 max-w-2xl text-lg text-text-sec sm:text-xl md:text-2xl"
                >
                    La herramienta definitiva para contadores y PyMEs. Consulta leyes, reglamentos y criterios con un asistente que entiende el contexto fiscal mexicano.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-14 flex w-full flex-col space-y-4 sm:w-auto sm:flex-row sm:space-y-0 sm:space-x-4"
                >
                    {showAuthenticatedCta ? (
                        <Link href="/chat">
                            <Button size="lg" variant="primary" className="w-full sm:w-auto text-base px-8">
                                Ir al Chat
                            </Button>
                        </Link>
                    ) : (
                        <>
                            {hasSession ? (
                                <Link href="/chat">
                                    <Button size="lg" variant="primary" className="w-full sm:w-auto text-base px-8">
                                        Probar ahora
                                    </Button>
                                </Link>
                            ) : (
                                <form action={guestLogin}>
                                    <Button size="lg" variant="primary" type="submit" className="w-full sm:w-auto text-base px-8">
                                        Probar ahora
                                    </Button>
                                </form>
                            )}
                            <Link href="/register">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">
                                    Crear cuenta
                                </Button>
                            </Link>
                        </>
                    )}
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
