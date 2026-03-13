"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Bookmark, Info, Calendar, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LawArticlePayload } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ArticleViewerProps {
    article: LawArticlePayload | null;
    isOpen: boolean;
    onClose: () => void;
}

type LegalBlock = {
    kind: "heading" | "paragraph" | "item";
    text: string;
    marker?: string;
};

function stripDiacritics(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizeLine(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function isPdfNoiseLine(line: string): boolean {
    const normalized = stripDiacritics(line).toUpperCase();

    if (!normalized) return true;
    if (/^\d+\s+DE\s+\d+$/.test(normalized)) return true;
    if (/^ULTIMA REFORMA DOF/.test(normalized)) return true;
    if (/^CAMARA DE DIPUTADOS/.test(normalized)) return true;
    if (/^SECRETARIA GENERAL$/.test(normalized)) return true;
    if (/^SECRETARIA DE SERVICIOS PARLAMENTARIOS$/.test(normalized)) return true;
    if (/^CODIGO FISCAL DE LA FEDERACION$/.test(normalized)) return true;
    if (/^LEY [A-Z\s]+$/.test(normalized) && normalized.length > 24) return true;

    return false;
}

function looksLikeListStart(line: string): boolean {
    return /^(?:[IVXLCDM]+\.|\d+\.|[A-Z]\)|[a-z]\)|[A-Z]\.-)\s+/.test(line);
}

function looksLikeHeading(line: string): boolean {
    if (line.endsWith(":")) return true;
    const normalized = stripDiacritics(line);
    return /^[A-Z0-9\s.,()/-]+$/.test(normalized) && normalized.length >= 12 && normalized.length <= 120;
}

function parseLegalBlocks(text: string): LegalBlock[] {
    const rawLines = text
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(normalizeLine)
        .filter(Boolean)
        .filter((line) => !isPdfNoiseLine(line));

    const chunks: string[] = [];
    let current = "";

    for (const line of rawLines) {
        const newSection = looksLikeListStart(line) || looksLikeHeading(line);

        if (!current) {
            current = line;
            continue;
        }

        if (newSection) {
            chunks.push(current);
            current = line;
            continue;
        }

        if (current.endsWith("-")) {
            current = `${current.slice(0, -1)}${line}`;
        } else {
            current = `${current} ${line}`;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks
        .map((chunk) => chunk.replace(/\s{2,}/g, " ").trim())
        .filter(Boolean)
        .map((chunk) => {
            const markerMatch = chunk.match(/^(?:([IVXLCDM]+\.)|(\d+\.)|([A-Z]\))|([a-z]\))|([A-Z]\.-))\s+(.+)$/);
            if (markerMatch) {
                const marker = markerMatch[1] || markerMatch[2] || markerMatch[3] || markerMatch[4] || markerMatch[5] || "";
                return {
                    kind: "item",
                    marker,
                    text: markerMatch[6]
                } satisfies LegalBlock;
            }

            if (looksLikeHeading(chunk)) {
                return {
                    kind: "heading",
                    text: chunk.replace(/:$/, "")
                } satisfies LegalBlock;
            }

            return {
                kind: "paragraph",
                text: chunk
            } satisfies LegalBlock;
        });
}

export function ArticleViewer({ article, isOpen, onClose }: ArticleViewerProps) {
    const [isFavorite, setIsFavorite] = useState(false);

    const articleText = article?.text;
    const legalBlocks = useMemo(() => {
        if (!articleText) return [];
        return parseLegalBlocks(articleText);
    }, [articleText]);

    if (!article && isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && article && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative h-full w-full max-w-2xl border-l border-border-glow bg-bg-sec/95 shadow-2xl backdrop-blur-md flex flex-col"
                    >
                        <div className="flex items-center justify-between border-b border-border-glow/50 p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-main/10 text-cyan-glow border border-cyan-main/20">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="bg-cyan-main/10 text-cyan-glow border-cyan-main/30 text-[10px] uppercase font-bold px-2 py-0">
                                            {article.documentAbbreviation}
                                        </Badge>
                                        <span className="text-xs text-text-sec font-medium tracking-wider">MARCO LEGAL MEXICO</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-text-main leading-tight line-clamp-1">{article.documentName}</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-text-sec hover:bg-white/5 hover:text-text-main transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsFavorite(!isFavorite)}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 group",
                                        isFavorite
                                            ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.15)]"
                                            : "bg-cyan-main/5 border-cyan-main/20 text-cyan-glow hover:bg-cyan-main/10"
                                    )}
                                    title="Marcar como favorito"
                                >
                                    <Bookmark size={14} className={cn(isFavorite ? "fill-current" : "")} />
                                    <span className="text-sm font-bold uppercase tracking-widest mt-0.5">
                                        Articulo {article.articleNumber} {isFavorite && "- Guardado"}
                                    </span>
                                </button>

                                {article.title && (
                                    <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main to-text-main/60 leading-tight">
                                        {article.title}
                                    </h3>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-br from-cyan-main/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative space-y-4">
                                    {legalBlocks.length > 0 ? (
                                        legalBlocks.map((block, idx) => {
                                            const isHighlighted = article.fragments?.some(f => {
                                                const fText = typeof f === "string" ? f : f.text;
                                                return block.text.toLowerCase().includes(fText.toLowerCase()) || 
                                                       fText.toLowerCase().includes(block.text.toLowerCase());
                                            });

                                            if (block.kind === "heading") {
                                                return (
                                                    <h4 key={idx} className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-main/90 pt-3">
                                                        {block.text}
                                                    </h4>
                                                );
                                            }

                                            if (block.kind === "item") {
                                                return (
                                                    <div key={idx} className={cn(
                                                        "flex gap-3 rounded-xl border px-4 py-3 transition-all",
                                                        isHighlighted 
                                                            ? "border-cyan-main bg-cyan-main/10 shadow-[0_0_15px_rgba(32,196,255,0.1)] scale-[1.02] z-10" 
                                                            : "border-border-glow/40 bg-bg-main/35"
                                                    )}>
                                                        <span className={cn(
                                                            "mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-2 text-[11px] font-bold",
                                                            isHighlighted 
                                                                ? "border-bg-main bg-cyan-main text-bg-main" 
                                                                : "border-cyan-main/40 bg-cyan-main/10 text-cyan-main"
                                                        )}>
                                                            {block.marker}
                                                        </span>
                                                        <p className={cn(
                                                            "text-[17px] leading-8",
                                                            isHighlighted ? "text-text-main font-semibold" : "text-text-main/90"
                                                        )}>{block.text}</p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <p key={idx} className={cn(
                                                    "text-[17px] leading-8 font-medium transition-all",
                                                    isHighlighted 
                                                        ? "text-cyan-glow bg-cyan-main/5 px-2 rounded-lg border-l-2 border-cyan-main" 
                                                        : "text-text-main/90"
                                                )}>
                                                    {block.text}
                                                </p>
                                            );
                                        })
                                    ) : (
                                        <p className="text-[17px] leading-8 text-text-main/90 font-medium whitespace-pre-wrap">{article.text}</p>
                                    )}
                                </div>

                                {article.text.toLowerCase().includes("resumen operativo") && (
                                    <div className="mt-6 flex items-start gap-4 p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                                        <Info size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-500/80 leading-snug">
                                            <span className="font-bold">Nota tecnica:</span> Este contenido es un resumen operativo para consulta rapida. Se recomienda cotejar con el texto integro en la publicacion oficial.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {article.keywords.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-text-sec uppercase tracking-widest">Temas relacionados</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {article.keywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 rounded-lg bg-bg-main border border-border-glow/50 text-xs text-text-sec hover:border-cyan-main/30 hover:text-cyan-glow transition-all cursor-default"
                                            >
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-8 border-t border-border-glow/30">
                                <div className="flex items-center gap-2 text-sm font-bold text-cyan-main uppercase tracking-widest">
                                    <Info size={14} /> Metadatos del Documento
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-bg-main border border-border-glow/30">
                                        <div className="text-[10px] text-text-sec uppercase font-bold mb-1 opacity-60">Fuente Legislativa</div>
                                        <div className="text-sm text-text-main font-medium">{article.document.source}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-bg-main border border-border-glow/30">
                                        <div className="text-[10px] text-text-sec uppercase font-bold mb-1 opacity-60">Ultima Actualizacion</div>
                                        <div className="flex items-center gap-2 text-sm text-text-main font-medium">
                                            <Calendar size={14} className="text-cyan-glow/60" />
                                            {article.document.lastUpdate}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-glow/50 bg-bg-main/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20">
                                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Estatus: Vigente 2024</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(article.source, "_blank")}
                                className="w-full sm:w-auto gap-2 text-xs border-cyan-main/30 hover:bg-cyan-main/5 text-text-sec hover:text-cyan-glow"
                            >
                                Camara de Diputados <ExternalLink size={14} />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
