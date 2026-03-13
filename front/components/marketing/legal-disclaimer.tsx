"use client";

import { Container } from "../layout/container";
import { AlertTriangle } from "lucide-react";

export function LegalDisclaimer() {
    return (
        <section className="py-12 bg-bg-main border-y border-border-glow">
            <Container>
                <div className="flex flex-col md:flex-row items-center gap-6 bg-yellow-500/5 p-8 rounded-2xl border border-yellow-500/20">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 flex-shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 className="text-yellow-500 font-bold mb-1 uppercase tracking-wider text-xs">Aviso Legal Importante</h4>
                        <p className="text-text-sec text-sm leading-relaxed italic">
                            MyFiscal es una herramienta de orientación basada en inteligencia artificial y recuperación normativa.
                            <strong> No constituye asesoría fiscal, contable o legal definitiva.</strong> Los resultados dependen de la vigencia de las normas y el contexto proporcionado.
                            Recomendamos siempre validar las conclusiones con un profesional certificado antes de la toma de decisiones críticas.
                        </p>
                    </div>
                </div>
            </Container>
        </section>
    );
}
