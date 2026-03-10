"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Bookmark, Info, Calendar, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LawArticlePayload } from "@/lib/types";

interface ArticleViewerProps {
    article: LawArticlePayload | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ArticleViewer({ article, isOpen, onClose }: ArticleViewerProps) {
    if (!article && isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && article && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative h-full w-full max-w-2xl border-l border-border-glow bg-bg-sec/95 shadow-2xl backdrop-blur-md flex flex-col"
                    >
                        {/* Header */}
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
                                        <span className="text-xs text-text-sec font-medium tracking-wider">MARCO LEGAL MÉXICO</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-text-main leading-tight line-clamp-1">
                                        {article.documentName}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-text-sec hover:bg-white/5 hover:text-text-main transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                            {/* Article identification */}
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-main/5 border border-cyan-main/20 text-cyan-glow">
                                    <Bookmark size={14} />
                                    <span className="text-sm font-bold uppercase tracking-widest">Artículo {article.articleNumber}</span>
                                </div>

                                {article.title && (
                                    <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main to-text-main/60 leading-tight">
                                        {article.title}
                                    </h3>
                                )}
                            </div>

                            {/* Legal Text */}
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-br from-cyan-main/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative leading-relaxed text-text-main/90 text-lg whitespace-pre-wrap font-medium">
                                    {article.text}
                                </div>
                                {article.text.toLowerCase().includes("resumen operativo") && (
                                    <div className="mt-6 flex items-start gap-4 p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                                        <Info size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-500/80 leading-snug">
                                            <span className="font-bold">Nota técnica:</span> Este contenido es un resumen operativo para fines de consulta rápida. Se recomienda cotejar con el texto íntegro en la publicación oficial.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Tags/Keywords */}
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

                            {/* Document metadata */}
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
                                        <div className="text-[10px] text-text-sec uppercase font-bold mb-1 opacity-60">Última Actualización</div>
                                        <div className="flex items-center gap-2 text-sm text-text-main font-medium">
                                            <Calendar size={14} className="text-cyan-glow/60" />
                                            {article.document.lastUpdate}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer with status */}
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
                                Cámara de Diputados <ExternalLink size={14} />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
