"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface PromptSuggestionsProps {
    onSelect: (prompt: string) => void;
}

export function PromptSuggestions({ onSelect }: PromptSuggestionsProps) {
    const suggestions = [
        "¿Qué pasa si no presento una declaración mensual?",
        "¿Qué obligaciones tengo si tributo en RESICO?",
        "¿Cómo funciona el IVA en servicios profesionales?",
        "¿Qué multas puede haber por omitir ingresos?",
    ];

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 mt-8 w-full max-w-4xl mx-auto">
            {suggestions.map((prompt, i) => (
                <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    onClick={() => onSelect(prompt)}
                    className="group flex items-start gap-4 rounded-xl border border-border-glow bg-bg-sec/50 p-4 text-left transition-all hover:border-cyan-main/40 hover:bg-bg-sec/80 hover:shadow-[0_0_15px_rgba(32,196,255,0.05)]"
                >
                    <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-text-sec transition-colors group-hover:text-text-main line-clamp-2">
                            {prompt}
                        </span>
                    </div>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-main text-text-sec transition-all group-hover:bg-cyan-main/20 group-hover:text-cyan-main">
                        <ArrowRight size={14} />
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
