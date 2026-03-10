import { useState } from "react";
import { motion } from "framer-motion";
import { User, Download, CheckCircle2, AlertCircle, FileText, ExternalLink, Copy, Share2, ThumbsUp, ThumbsDown, RotateCcw, Check } from "lucide-react";
import { SourceCard } from "./source-card";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { StructuredAnswer, SourceReference } from "@/lib/types";

interface MessageBubbleProps {
    role: "user" | "assistant" | "system";
    id?: string;
    content: string | StructuredAnswer;
    sources?: SourceReference[];
    onOpenArticle?: (article: any) => void;
    onRegenerate?: () => void;
}

export function MessageBubble({ role, content, sources, onOpenArticle, onRegenerate }: MessageBubbleProps) {
    const isUser = role === "user";
    const isSystem = role === "system";

    if (isSystem) {
        return (
            <div className="flex justify-center mb-8 px-4 opacity-70">
                <div className="bg-bg-sec/50 border border-border-glow rounded-full px-4 py-1.5 text-xs text-text-sec">
                    {typeof content === "string" ? content : "Sistema"}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn("flex w-full mb-8", isUser ? "justify-end" : "justify-start")}
        >
            <div className={cn("flex w-full gap-4", isUser ? "max-w-[85%] sm:max-w-[70%] flex-row-reverse" : "max-w-[100%] sm:max-w-[90%] flex-row")}>
                <div
                    className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border mt-1",
                        isUser
                            ? "bg-bg-sec border-border-glow text-text-sec"
                            : "bg-cyan-main/10 border-cyan-main/30 text-cyan-glow shadow-[0_0_15px_rgba(32,196,255,0.1)]"
                    )}
                >
                    {isUser ? <User size={18} /> : <span className="font-bold text-xs">MF</span>}
                </div>

                <div className={cn("flex flex-col w-full", isUser ? "items-end" : "items-start")}>
                    <div
                        className={cn(
                            "rounded-2xl px-5 py-4 text-[15px] leading-relaxed w-full shadow-sm",
                            isUser
                                ? "bg-bg-sec border border-border-glow text-text-main rounded-tr-sm"
                                : "bg-bg-sec/40 border border-border-glow text-text-main rounded-tl-sm backdrop-blur-sm"
                        )}
                    >
                        {typeof content === "string" ? (
                            <div className="space-y-4">
                                <p>{content}</p>
                                {!isUser && (
                                    <MessageActions content={content} onRegenerate={onRegenerate} />
                                )}
                            </div>
                        ) : (
                            <StructuredResponseView 
                                answer={content} 
                                sources={sources} 
                                onOpenArticle={onOpenArticle} 
                                onRegenerate={onRegenerate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function StructuredResponseView({
    answer,
    sources,
    onOpenArticle,
    onRegenerate
}: {
    answer: StructuredAnswer;
    sources?: SourceReference[];
    onOpenArticle?: (article: any) => void;
    onRegenerate?: () => void;
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-cyan-main uppercase tracking-widest">
                    Síntesis
                </h4>
                <p className="text-text-main/90">{answer.summary}</p>
            </div>

            {answer.foundation.length > 0 && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-cyan-main uppercase tracking-widest">
                        Fundamento principal
                    </h4>
                    <div className="rounded-xl bg-bg-main/60 border border-border-glow/50 p-4 space-y-2">
                        {answer.foundation.map((f, i) => (
                            <p key={i} className="text-sm text-text-main leading-relaxed flex gap-2">
                                <span className="text-cyan-glow opacity-60 mt-1">•</span> {f}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {(answer.scenarios.length > 0 || answer.consequences.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {answer.scenarios.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-text-sec uppercase tracking-widest">Cenarios / Requisitos</h4>
                            <ul className="space-y-1.5 list-none">
                                {answer.scenarios.map((s, i) => (
                                    <li key={i} className="text-xs text-text-sec flex gap-2">
                                        <CheckCircle2 size={12} className="text-cyan-main mt-0.5 shrink-0" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {answer.consequences.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-red-400/80 uppercase tracking-widest">Riesgos / Consecuencias</h4>
                            <ul className="space-y-1.5 list-none">
                                {answer.consequences.map((c, i) => (
                                    <li key={i} className="text-xs text-text-sec flex gap-2">
                                        <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                                        <span>{c}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {sources && sources.length > 0 && (
                <div className="pt-4 border-t border-border-glow/30">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-cyan-main uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} /> Fuentes consultadas
                        </h4>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                            answer.certainty === "Muy Alta" || answer.certainty === "Alta"
                                ? "bg-green-400/5 text-green-400 border-green-400/20"
                                : "bg-yellow-400/5 text-yellow-400 border-yellow-400/20"
                        )}>
                            Certeza: {answer.certainty}
                        </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
                        {sources.map(source => (
                            <SourceCard
                                key={source.id}
                                id={source.id}
                                name={source.title}
                                type={source.articleRef || source.type}
                                onView={onOpenArticle}
                                className="p-3"
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-glow/20">
                <p className="text-[10px] text-text-sec leading-tight max-w-[400px]">
                    <span className="font-bold text-red-400/80">AVISO:</span> {answer.disclaimer}
                </p>
                <div className="hidden sm:block text-[10px] text-text-sec uppercase font-bold opacity-40">
                    ID: {Math.random().toString(36).substring(7)}
                </div>
            </div>

            <MessageActions content={answer} onRegenerate={onRegenerate} />
        </div>
    );
}

function MessageActions({ 
    content, 
    onRegenerate 
}: { 
    content: string | StructuredAnswer, 
    onRegenerate?: () => void 
}) {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

    const handleCopy = () => {
        let text = "";
        if (typeof content === "string") {
            text = content;
        } else {
            text = `SÍNTESIS: ${content.summary}\n\nFUNDAMENTO: ${content.foundation.join(", ")}\n\nESCENARIOS: ${content.scenarios.join(", ")}\n\nCONSECUENCIAS: ${content.consequences.join(", ")}\n\nCERTEZA: ${content.certainty}\n\nAVISO: ${content.disclaimer}`;
        }
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const text = typeof content === "string" ? content : content.summary;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'MyFiscal - Consulta Legal',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                handleCopy();
            }
        } else {
            handleCopy();
        }
    };

    const handleDownload = () => {
        let text = "";
        if (typeof content === "string") {
            text = content;
        } else {
            text = `MYFISCAL - REPORTE DE CONSULTA\n\nSÍNTESIS:\n${content.summary}\n\nFUNDAMENTO:\n- ${content.foundation.join("\n- ")}\n\nESCENARIOS:\n- ${content.scenarios.join("\n- ")}\n\nCONSECUENCIAS:\n- ${content.consequences.join("\n- ")}\n\nCERTEZA: ${content.certainty}\n\nAVISO LEGAL: ${content.disclaimer}\n\nGenerado por MyFiscal v1.0`;
        }
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `myfiscal-respuesta-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-wrap items-center gap-1 sm:gap-4 mt-2 pt-4 border-t border-border-glow/10">
            <button 
                onClick={handleCopy} 
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                title="Copiar respuesta"
            >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span className="hidden xs:inline">{copied ? "Copiado" : "Copiar"}</span>
            </button>

            <button 
                onClick={handleShare} 
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                title="Compartir"
            >
                <Share2 size={14} />
                <span className="hidden xs:inline">Compartir</span>
            </button>

            <button 
                onClick={handleDownload} 
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                title="Descargar .txt"
            >
                <Download size={14} />
                <span className="hidden xs:inline">Descargar</span>
            </button>

            <div className="h-4 w-px bg-border-glow/20 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1">
                <button 
                    onClick={() => setFeedback('up')} 
                    className={cn(
                        "p-1.5 rounded-lg hover:bg-white/5 transition-colors", 
                        feedback === 'up' ? "text-cyan-main bg-cyan-main/10" : "text-text-sec"
                    )}
                    title="Útil"
                >
                    <ThumbsUp size={14} />
                </button>
                <button 
                    onClick={() => setFeedback('down')} 
                    className={cn(
                        "p-1.5 rounded-lg hover:bg-white/5 transition-colors", 
                        feedback === 'down' ? "text-red-400 bg-red-400/10" : "text-text-sec"
                    )}
                    title="No útil"
                >
                    <ThumbsDown size={14} />
                </button>
            </div>

            {onRegenerate && (
                <button 
                    onClick={onRegenerate} 
                    className="ml-auto flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                    title="Regenerar respuesta"
                >
                    <RotateCcw size={14} />
                    <span className="hidden xs:inline">Regenerar</span>
                </button>
            )}
        </div>
    );
}
