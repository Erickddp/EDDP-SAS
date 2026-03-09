"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DetailToggleProps {
    level: "sencilla" | "detallada" | "tecnica";
    onChange: (level: "sencilla" | "detallada" | "tecnica") => void;
}

export function DetailToggle({ level, onChange }: DetailToggleProps) {
    const levels: Array<{ id: "sencilla" | "detallada" | "tecnica"; label: string }> = [
        { id: "sencilla", label: "Sencilla" },
        { id: "detallada", label: "Detallada" },
        { id: "tecnica", label: "Técnica" },
    ];

    return (
        <div className="inline-flex rounded-xl bg-bg-sec p-1 border border-border-glow shadow-sm overflow-x-auto max-w-full">
            {levels.map((lvl) => (
                <button
                    key={lvl.id}
                    onClick={() => onChange(lvl.id)}
                    className={cn(
                        "relative flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors z-10 whitespace-nowrap flex-shrink-0",
                        level === lvl.id ? "text-text-main" : "text-text-sec hover:text-text-main"
                    )}
                >
                    {level === lvl.id && (
                        <motion.div
                            layoutId="detail-bg"
                            className="absolute inset-0 -z-10 rounded-lg bg-cyan-main/15 border border-cyan-main/20 shadow-[0_0_10px_rgba(32,196,255,0.1)]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {lvl.label}
                </button>
            ))}
        </div>
    );
}
