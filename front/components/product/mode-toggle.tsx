"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Briefcase } from "lucide-react";

interface ModeToggleProps {
    mode: "casual" | "profesional";
    onChange: (mode: "casual" | "profesional") => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
    return (
        <div className="inline-flex rounded-xl bg-bg-sec p-1 border border-border-glow shadow-sm">
            <button
                onClick={() => onChange("casual")}
                className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors z-10",
                    mode === "casual" ? "text-text-main" : "text-text-sec hover:text-text-main"
                )}
            >
                {mode === "casual" && (
                    <motion.div
                        layoutId="mode-bg"
                        className="absolute inset-0 -z-10 rounded-lg bg-cyan-main/20 border border-cyan-main/30 shadow-[0_0_10px_rgba(32,196,255,0.2)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Sparkles size={14} className={mode === "casual" ? "text-cyan-main" : ""} />
                Casual
            </button>
            <button
                onClick={() => onChange("profesional")}
                className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors z-10",
                    mode === "profesional" ? "text-text-main" : "text-text-sec hover:text-text-main"
                )}
            >
                {mode === "profesional" && (
                    <motion.div
                        layoutId="mode-bg"
                        className="absolute inset-0 -z-10 rounded-lg bg-cyan-main/20 border border-cyan-main/30 shadow-[0_0_10px_rgba(32,196,255,0.2)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Briefcase size={14} className={mode === "profesional" ? "text-cyan-main" : ""} />
                Profesional
            </button>
        </div>
    );
}
