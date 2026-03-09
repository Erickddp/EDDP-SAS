"use client";

import { FileText, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceCardProps {
    name: string;
    type: string;
    className?: string;
}

export function SourceCard({ name, type, className }: SourceCardProps) {
    return (
        <div className={cn("group rounded-xl border border-border-glow bg-bg-sec/50 p-4 transition-all hover:border-cyan-main/40 hover:bg-bg-sec hover:shadow-[0_0_15px_rgba(32,196,255,0.05)]", className)}>
            <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-main/10 text-cyan-main border border-cyan-main/20">
                    <FileText size={18} />
                </div>
                <div className="flex-1">
                    <h5 className="text-sm font-semibold text-text-main line-clamp-2">{name}</h5>
                    <p className="text-xs text-text-sec mt-1">{type}</p>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-glow/40 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                    <CheckCircle2 size={14} className="opacity-80" />
                    <span>Vigente</span>
                </div>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-cyan-main hover:text-cyan-glow transition-colors">
                    Ver artículo <ExternalLink size={14} />
                </button>
            </div>
        </div>
    );
}
