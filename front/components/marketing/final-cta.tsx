"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Button } from "../ui/button";
import Link from "next/link";
import { guestLogin } from "@/lib/auth";

export function FinalCTA({ hasSession = false }: { hasSession?: boolean }) {
    return (
        <section className="relative overflow-hidden py-24 md:py-32">
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-bg-sec to-bg-main" />
            <div
                className="absolute left-1/2 top-1/2 z-0 h-[400px] w-full max-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-main/10 blur-[120px]"
                aria-hidden="true"
            />

            <Container className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl rounded-3xl border border-border-glow bg-bg-sec/50 p-8 shadow-2xl backdrop-blur-md md:p-16"
                >
                    <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-text-main md:text-5xl">
                        Toma el control de tus <span className="text-cyan-main">consultas fiscales</span> hoy mismo.
                    </h2>
                    <p className="mb-10 text-lg text-text-sec md:text-xl">
                        Únete a los contadores y empresas que ya están ahorrando tiempo y ganando seguridad jurídica con MyFiscal.
                    </p>
                    <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                        {hasSession ? (
                            <Link href="/chat">
                                <Button size="lg" variant="primary" className="w-full sm:w-auto text-lg px-10 h-14">
                                    Probar Gratis como Invitado
                                </Button>
                            </Link>
                        ) : (
                            <form action={guestLogin}>
                                <Button size="lg" variant="primary" type="submit" className="w-full sm:w-auto text-lg px-10 h-14">
                                    Probar Gratis como Invitado
                                </Button>
                            </form>
                        )}
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-10 h-14 border-cyan-main/30 text-cyan-main">
                                Crear Cuenta Pro
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </Container>
        </section>
    );
}
