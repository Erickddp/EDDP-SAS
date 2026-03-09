"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Button } from "../ui/button";

export function FinalCTA() {
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
                        La consulta fiscal no debería sentirse inaccesible.
                    </h2>
                    <p className="mb-10 text-lg text-text-sec md:text-xl">
                        MyFiscal busca acercar información útil, clara y profesional a más personas.
                    </p>
                    <Button size="lg" variant="primary" className="w-full sm:w-auto text-lg px-10 h-14">
                        Unirme a la lista
                    </Button>
                </motion.div>
            </Container>
        </section>
    );
}
