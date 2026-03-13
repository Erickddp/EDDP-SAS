import { useState } from "react";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    AlertCircle,
    FileText,
    Copy,
    Share2,
    ThumbsUp,
    ThumbsDown,
    RotateCcw,
    Check,
    MessageCircle,
    Bookmark,
    Printer,
    DollarSign,
    Calculator,
    Clock,
    ArrowRight,
    Sparkles
} from "lucide-react";
import { SourceCard } from "./source-card";
import { cn } from "@/lib/utils";
import { StructuredAnswer, SourceReference, LawArticlePayload, CitationEntry } from "@/lib/types";

interface MessageBubbleProps {
    role: "user" | "assistant" | "system";
    id?: string;
    content: string | StructuredAnswer;
    sources?: SourceReference[];
    onOpenArticle?: (article: LawArticlePayload) => void;
    onRegenerate?: () => void;
    userAvatarUrl?: string;
    assistantAvatarUrl?: string;
}

function normalizeList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map(item => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "ref" in (item as any)) return (item as any).ref;
        return "";
    }).filter((s): s is string => typeof s === "string" && s.trim().length > 0);
}

function normalizeStructured(answer: StructuredAnswer) {
    return {
        summary: typeof answer.summary === "string" ? answer.summary : "",
        summaryCitations: normalizeList(answer.summaryCitations),
        foundation: normalizeList(answer.foundation),
        foundationCitations: normalizeList(answer.foundationCitations),
        explanation: typeof answer.explanation === "string" ? answer.explanation : "",
        explanationCitations: normalizeList(answer.explanationCitations),
        example: typeof answer.example === "string" ? answer.example : "",
        exampleCitations: normalizeList(answer.exampleCitations),
        citations: Array.isArray(answer.citations) ? answer.citations : [],
        scenarios: normalizeList(answer.scenarios),
        consequences: normalizeList(answer.consequences),
        relatedArticles: normalizeList(answer.relatedArticles),
        legalInterpretation: typeof answer.legalInterpretation === "string" ? answer.legalInterpretation : "",
        certainty: typeof answer.certainty === "string" && answer.certainty.trim() ? answer.certainty : "Referencia normativa",
        disclaimer: typeof answer.disclaimer === "string" ? answer.disclaimer : "",
        // Intent: multa
        montoMinimo: typeof answer.montoMinimo === "string" ? answer.montoMinimo : "",
        montoMaximo: typeof answer.montoMaximo === "string" ? answer.montoMaximo : "",
        factoresAgravantes: normalizeList(answer.factoresAgravantes),
        reduccion: typeof answer.reduccion === "string" ? answer.reduccion : null,
        // Intent: calculo
        pasos: normalizeList(answer.pasos),
        formula: typeof answer.formula === "string" ? answer.formula : "",
        variables: normalizeList(answer.variables),
        ejemploNumerico: typeof answer.ejemploNumerico === "string" ? answer.ejemploNumerico : "",
        // Intent: plazo
        fechaLimite: typeof answer.fechaLimite === "string" ? answer.fechaLimite : "",
        periodicidad: typeof answer.periodicidad === "string" ? answer.periodicidad : "",
        consecuenciaIncumplimiento: typeof answer.consecuenciaIncumplimiento === "string" ? answer.consecuenciaIncumplimiento : "",
        prorrogas: typeof answer.prorrogas === "string" ? answer.prorrogas : null
    };
}

export function MessageBubble({
    role,
    content,
    sources,
    onOpenArticle,
    onRegenerate,
    userAvatarUrl = "/avatars/avatar-ocean.svg",
    assistantAvatarUrl = "/icono.png"
}: MessageBubbleProps) {
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
                        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border mt-1 shadow-sm",
                        isUser
                            ? "bg-cyan-main/10 border-cyan-main/30"
                            : "bg-white dark:bg-bg-sec border-border-glow p-1.5"
                    )}
                >
                    {!isUser && !assistantAvatarUrl && <span className="text-[10px] font-bold text-cyan-main">AI</span>}
                    {isUser && !userAvatarUrl && <span className="text-[10px] font-bold text-text-sec">TU</span>}
                    <img
                        src={isUser ? userAvatarUrl : assistantAvatarUrl}
                        alt={isUser ? "Usuario" : "MyFiscal"}
                        className={cn("h-full w-full object-contain transition-opacity duration-300", !isUser && "p-0.5")}
                        loading="lazy"
                        onError={(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = event.currentTarget;
                            target.style.opacity = "0";
                        }}
                    />
                </div>

                <div className={cn("flex flex-col w-full", isUser ? "items-end" : "items-start")}>
                    <div
                        className={cn(
                            "rounded-2xl px-5 py-4 text-[15px] leading-relaxed w-full shadow-sm",
                            isUser
                                ? "bg-cyan-main/12 border border-cyan-main/35 text-text-main rounded-tr-sm shadow-[0_0_20px_rgba(32,196,255,0.08)]"
                                : "bg-bg-sec border border-border-glow text-text-main rounded-tl-sm shadow-sm"
                        )}
                    >
                        {typeof content === "string" ? (
                            <div className="space-y-4">
                                <p>{content}</p>
                                {!isUser && <MessageActions content={content} onRegenerate={onRegenerate} />}
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
    onOpenArticle?: (article: LawArticlePayload) => void;
    onRegenerate?: () => void;
}) {
    const data = normalizeStructured(answer);
    const isComplex = !!data.legalInterpretation || data.relatedArticles.length > 0;

    // Detect intent from field presence
    const isMulta = !!data.montoMinimo || !!data.montoMaximo || data.factoresAgravantes.length > 0;
    const isCalculo = data.pasos.length > 0 || !!data.formula;
    const isPlazo = !!data.fechaLimite || !!data.periodicidad;

    return (
        <div className="space-y-8">
            {/* 1. SÍNTESIS */}
            <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-[11px] font-black text-cyan-main uppercase tracking-[0.2em]">
                    <Sparkles size={14} className="text-cyan-main/70" /> SÍNTESIS
                </h4>
                <div className="rounded-xl bg-white dark:bg-bg-card border border-border-glow shadow-sm p-4 ring-1 ring-cyan-main/5">
                    <p className="text-[15px] text-text-main/90 leading-relaxed font-medium">{data.summary}</p>
                    <CitationBlock refs={data.summaryCitations} citations={data.citations} />
                </div>
            </div>

            {/* 2. ANÁLISIS DETALLADO */}
            {(data.explanation || data.example || isMulta || isCalculo || isPlazo) && (
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[11px] font-black text-cyan-main uppercase tracking-[0.2em]">
                        <MessageCircle size={14} className="text-cyan-main/70" /> ANÁLISIS DETALLADO
                    </h4>
                    
                    <div className="space-y-4 pl-1">
                        {data.explanation && (
                            <div className="rounded-xl bg-bg-main/50 border border-border-glow/50 p-4">
                                <p className="text-sm text-text-main/90 leading-relaxed whitespace-pre-line">{data.explanation}</p>
                                <CitationBlock refs={data.explanationCitations} citations={data.citations} />
                            </div>
                        )}
                        
                        {data.example && (
                            <div className="rounded-xl bg-teal-500/5 border border-teal-500/20 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Ejemplo Ilustrativo</span>
                                </div>
                                <p className="text-sm text-text-main/90 leading-relaxed whitespace-pre-line">{data.example}</p>
                                <CitationBlock refs={data.exampleCitations} citations={data.citations} />
                            </div>
                        )}

                        {/* Intent Views integrated into Analysis */}
                        {isMulta && <MultaView data={data} />}
                        {isCalculo && <CalculoView data={data} />}
                        {isPlazo && <PlazoView data={data} />}

                        {data.legalInterpretation && (
                            <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Interpretación Técnica</span>
                                </div>
                                <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">{data.legalInterpretation}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. FUNDAMENTO LEGAL */}
            {(data.foundation.length > 0 || data.relatedArticles.length > 0) && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-[11px] font-black text-cyan-main uppercase tracking-[0.2em]">
                        <FileText size={14} className="text-cyan-main/70" /> FUNDAMENTO LEGAL
                    </h4>
                    <div className="rounded-xl bg-bg-main border border-border-glow shadow-sm p-5 space-y-4">
                        {data.foundation.length > 0 && (
                            <div className="space-y-2">
                                {data.foundation.map((f, i) => (
                                    <p key={i} className="text-sm text-text-main leading-relaxed flex gap-3">
                                        <span className="text-cyan-main font-bold mt-0.5">•</span> 
                                        <span>{f}</span>
                                    </p>
                                ))}
                                <CitationBlock refs={data.foundationCitations} citations={data.citations} />
                            </div>
                        )}

                        {data.relatedArticles.length > 0 && (
                            <div className="pt-3 border-t border-border-glow/40">
                                <p className="text-[10px] font-bold text-text-sec uppercase tracking-widest mb-2 opacity-70">Disposiciones Complementarias</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {data.relatedArticles.map((art, i) => (
                                        <p key={i} className="text-[13px] text-text-sec leading-relaxed flex gap-2 items-center bg-bg-sec/30 p-2 rounded-lg border border-border-glow/30">
                                            <ArrowRight size={10} className="text-cyan-main/40" /> {art}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. ESCENARIOS */}
            {(data.scenarios.length > 0 || data.consequences.length > 0) && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-[11px] font-black text-cyan-main uppercase tracking-[0.2em]">
                        <CheckCircle2 size={14} className="text-cyan-main/70" /> ESCENARIOS
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {data.scenarios.length > 0 && (
                            <div className="rounded-xl bg-bg-sec/40 border border-border-glow p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <h5 className="text-[10px] font-bold text-text-main uppercase tracking-widest">Requisitos y Condiciones</h5>
                                </div>
                                <ul className="space-y-2">
                                    {data.scenarios.map((s, i) => (
                                        <li key={i} className="text-[13px] text-text-sec flex gap-2 border-b border-border-glow/20 pb-2 last:border-0 last:pb-0">
                                            <span className="text-cyan-main/40">•</span>
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {data.consequences.length > 0 && (
                            <div className="rounded-xl bg-red-500/[0.03] border border-red-500/20 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={14} className="text-red-500" />
                                    <h5 className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest">Riesgos y Consecuencias</h5>
                                </div>
                                <ul className="space-y-2">
                                    {data.consequences.map((c, i) => (
                                        <li key={i} className="text-[13px] text-text-sec flex gap-2 border-b border-red-500/10 pb-2 last:border-0 last:pb-0">
                                            <span className="text-red-500/40">•</span>
                                            <span>{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 5. FUENTES CONSULTADAS */}
            {sources && sources.length > 0 && (
                <div className="space-y-4 pt-6 mt-6 border-t border-border-glow/60">
                    <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-[11px] font-black text-cyan-main uppercase tracking-[0.2em]">
                            <Bookmark size={14} className="text-cyan-main/70" /> FUENTES CONSULTADAS
                        </h4>
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                            data.certainty === "Muy Alta" || data.certainty === "Alta"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
                        )}>
                            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", 
                                data.certainty === "Muy Alta" || data.certainty === "Alta" ? "bg-green-500" : "bg-yellow-500"
                            )} />
                            Certeza: {data.certainty}
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {sources.map((source) => (
                            <SourceCard
                                key={source.id}
                                id={source.id}
                                name={source.title}
                                type={source.articleRef || source.type}
                                fragments={source.fragments?.map(f => typeof f === "string" ? f : f.text)}
                                onView={onOpenArticle}
                                className="p-3 bg-white dark:bg-bg-sec hover:border-cyan-main/30 hover:shadow-md transition-all"
                            />
                        ))}
                    </div>
                </div>
            )}

            <MessageActions content={answer} onRegenerate={onRegenerate} />
        </div>
    );
}

// ─── Citation Component ───────────────────────────────────────────────────

function CitationBlock({ refs, citations }: { refs: string[], citations: CitationEntry[] }) {
    if (!refs || refs.length === 0 || !citations || citations.length === 0) return null;
    
    const matched: CitationEntry[] = refs
        .map((ref) => citations.find((citation) => citation.ref === ref))
        .filter((citation): citation is CitationEntry => Boolean(citation));
    if (matched.length === 0) return null;

    return (
        <div className="mt-2 space-y-2 border-l-2 border-cyan-glow/30 pl-3 pt-1">
            {matched.map((c, i) => (
                <div key={i} className="text-[12px] leading-snug">
                    <span className={cn("font-bold mr-1.5", c.type === "primary" ? "text-cyan-main" : "text-text-sec")}>
                        {c.type === "primary" ? "Base:" : "Soporte:"} {c.law} Art. {c.articleNumber}
                    </span>
                    <span className="text-text-sec/80 italic">&quot;{c.quote}&quot;</span>
                </div>
            ))}
        </div>
    );
}

// ─── Intent-Specific Card Components ────────────────────────────────────────

function MultaView({ data }: { data: ReturnType<typeof normalizeStructured> }) {
    const hasMonto = data.montoMinimo || data.montoMaximo;
    return (
        <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                <DollarSign size={14} /> Multa / Sanción
            </h4>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-400/5 border border-amber-200 dark:border-amber-400/20 p-4 space-y-4 shadow-sm">
                {hasMonto && (
                    <div className="flex flex-wrap gap-3">
                        {data.montoMinimo && (
                            <div className="flex-1 min-w-[120px] rounded-lg bg-amber-100 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 p-3 text-center">
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400/70 uppercase tracking-wider mb-1">Mínimo</p>
                                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{data.montoMinimo}</p>
                            </div>
                        )}
                        {data.montoMaximo && (
                            <div className="flex-1 min-w-[120px] rounded-lg bg-amber-100 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 p-3 text-center">
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400/70 uppercase tracking-wider mb-1">Máximo</p>
                                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{data.montoMaximo}</p>
                            </div>
                        )}
                    </div>
                )}
                {data.factoresAgravantes.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider">Factores Agravantes</p>
                        <ul className="space-y-1 list-none">
                            {data.factoresAgravantes.map((f, i) => (
                                <li key={i} className="text-xs text-text-sec flex gap-2">
                                    <AlertCircle size={11} className="text-amber-400/60 mt-0.5 shrink-0" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {data.reduccion && (
                    <div className="rounded-lg bg-green-400/5 border border-green-400/15 p-3">
                        <p className="text-[10px] font-bold text-green-400/80 uppercase tracking-wider mb-1">Reducción Aplicable</p>
                        <p className="text-xs text-text-sec">{data.reduccion}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function CalculoView({ data }: { data: ReturnType<typeof normalizeStructured> }) {
    return (
        <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                <Calculator size={14} /> Cálculo
            </h4>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-400/5 border border-teal-200 dark:border-teal-400/20 p-4 space-y-4 shadow-sm">
                {data.formula && (
                    <div className="rounded-lg bg-teal-400/10 border border-teal-400/15 p-3">
                        <p className="text-[10px] font-bold text-teal-400/70 uppercase tracking-wider mb-1">Fórmula</p>
                        <p className="text-sm text-teal-200 font-mono">{data.formula}</p>
                    </div>
                )}
                {data.variables.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-teal-400/70 uppercase tracking-wider">Variables</p>
                        <ul className="space-y-1 list-none">
                            {data.variables.map((v, i) => (
                                <li key={i} className="text-xs text-text-sec flex gap-2">
                                    <span className="text-teal-400/60 font-mono mt-0.5">•</span>
                                    <span>{v}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {data.pasos.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-teal-400/70 uppercase tracking-wider">Pasos</p>
                        <ol className="space-y-2 list-none">
                            {data.pasos.map((p, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/15 border border-teal-400/25 text-[10px] font-bold text-teal-400">
                                        {i + 1}
                                    </span>
                                    <p className="text-xs text-text-sec leading-relaxed pt-0.5">{p}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
                {data.ejemploNumerico && (
                    <div className="rounded-lg bg-bg-main border border-border-glow p-3 shadow-sm">
                        <p className="text-[10px] font-bold text-text-sec/80 uppercase tracking-wider mb-1">Ejemplo Numérico</p>
                        <p className="text-xs text-text-main leading-relaxed whitespace-pre-line">{data.ejemploNumerico}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlazoView({ data }: { data: ReturnType<typeof normalizeStructured> }) {
    return (
        <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-widest">
                <Clock size={14} /> Plazos y Fechas
            </h4>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-400/5 border border-blue-200 dark:border-blue-400/20 p-4 space-y-4 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    {data.fechaLimite && (
                        <div className="flex-1 min-w-[160px] rounded-lg bg-blue-100 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20 p-3">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400/70 uppercase tracking-wider mb-1">Fecha Límite</p>
                            <p className="text-sm text-blue-700 dark:text-blue-200 font-semibold">{data.fechaLimite}</p>
                        </div>
                    )}
                    {data.periodicidad && (
                        <div className="flex-1 min-w-[120px] rounded-lg bg-blue-100 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20 p-3">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400/70 uppercase tracking-wider mb-1">Periodicidad</p>
                            <p className="text-sm text-blue-700 dark:text-blue-200 font-semibold">{data.periodicidad}</p>
                        </div>
                    )}
                </div>
                {data.consecuenciaIncumplimiento && (
                    <div className="rounded-lg bg-red-400/5 border border-red-400/15 p-3">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-red-400/80 uppercase tracking-wider mb-1">
                            <AlertCircle size={11} /> Incumplimiento
                        </p>
                        <p className="text-xs text-text-sec">{data.consecuenciaIncumplimiento}</p>
                    </div>
                )}
                {data.prorrogas && (
                    <div className="rounded-lg bg-green-400/5 border border-green-400/15 p-3">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-green-400/80 uppercase tracking-wider mb-1">
                            <ArrowRight size={11} /> Prórrogas
                        </p>
                        <p className="text-xs text-text-sec">{data.prorrogas}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessageActions({
    content,
    onRegenerate
}: {
    content: string | StructuredAnswer;
    onRegenerate?: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    const buildPlainText = (data: StructuredAnswer) => {
        const normalized = normalizeStructured(data);
        const foundation = normalized.foundation.join(", ");
        const scenarios = normalized.scenarios.join(", ");
        const consequences = normalized.consequences.join(", ");

        return `SÍNTESIS: ${normalized.summary}\n\nANÁLISIS: ${normalized.explanation}\n\nFUNDAMENTO LEGAL: ${foundation}\n\nESCENARIOS: ${scenarios}\n\nCONSECUENCIAS: ${consequences}\n\nCERTEZA: ${normalized.certainty}`;
    };

    const buildHtmlReport = (data: StructuredAnswer) => {
        const normalized = normalizeStructured(data);

        const listHtml = (items: string[]) => {
            if (items.length === 0) return "<li>Sin datos</li>";
            return `<li>${items.join("</li><li>")}</li>`;
        };

        return `<h1>MYFISCAL - REPORTE DE CONSULTA</h1>
            <h3>SÍNTESIS:</h3><p>${normalized.summary}</p>
            <h3>ANÁLISIS DETALLADO:</h3><p>${normalized.explanation}</p>
            <h3>FUNDAMENTO LEGAL:</h3><ul>${listHtml(normalized.foundation)}</ul>
            <h3>ESCENARIOS:</h3><ul>${listHtml(normalized.scenarios)}</ul>
            <h3>CONSECUENCIAS:</h3><ul>${listHtml(normalized.consequences)}</ul>
            <p><b>CERTEZA:</b> ${normalized.certainty}</p>`;
    };

    const handleCopy = () => {
        const text = typeof content === "string" ? content : buildPlainText(content);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const text = typeof content === "string" ? content : normalizeStructured(content).summary;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "MyFiscal - Consulta Legal",
                    text,
                    url: window.location.href
                });
            } catch {
                handleCopy();
            }
        } else {
            handleCopy();
        }
    };

    const handleWhatsApp = () => {
        const text = typeof content === "string" ? content : `MyFiscal: ${normalizeStructured(content).summary}`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
    };

    const handleDownloadPDF = () => {
        const text = typeof content === "string" ? content : buildHtmlReport(content);

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>MyFiscal Reporte</title>
                        <style>
                            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
                            h1, h3 { color: #0284c7; }
                            ul { margin-bottom: 20px; }
                        </style>
                    </head>
                    <body onload="window.print();window.close();">
                        ${text}
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 pt-4 border-t border-border-glow/10">
            <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                title="Copiar respuesta"
            >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span className="hidden xs:inline">{copied ? "Copiado" : "Copiar"}</span>
            </button>

            <button
                onClick={handleWhatsApp}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                title="WhatsApp"
            >
                <MessageCircle size={14} />
                <span className="hidden lg:inline">WhatsApp</span>
            </button>

            <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                title="Exportar PDF"
            >
                <Printer size={14} />
                <span className="hidden lg:inline">PDF</span>
            </button>

            <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold"
                title="Compartir"
            >
                <Share2 size={14} />
            </button>

            <div className="h-4 w-px bg-border-glow/20 mx-1 hidden sm:block" />

            <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-[10px] uppercase font-bold",
                    isFavorite ? "text-yellow-400 bg-yellow-400/10" : "text-text-sec"
                )}
                title="Favorito"
            >
                <Bookmark size={14} />
                <span className="hidden sm:inline">Favorito</span>
            </button>

            <div className="flex items-center gap-0.5">
                <button
                    onClick={() => setFeedback(feedback === "up" ? null : "up")}
                    className={cn(
                        "p-1.5 rounded-lg hover:bg-white/5 transition-colors",
                        feedback === "up" ? "text-cyan-main bg-cyan-main/10" : "text-text-sec"
                    )}
                    title="Util"
                >
                    <ThumbsUp size={14} />
                </button>
                <button
                    onClick={() => setFeedback(feedback === "down" ? null : "down")}
                    className={cn(
                        "p-1.5 rounded-lg hover:bg-white/5 transition-colors",
                        feedback === "down" ? "text-red-400 bg-red-400/10" : "text-text-sec"
                    )}
                    title="No util"
                >
                    <ThumbsDown size={14} />
                </button>
            </div>

            {onRegenerate && (
                <button
                    onClick={onRegenerate}
                    className="ml-auto flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-text-sec transition-colors text-[10px] uppercase font-bold group"
                    title="Regenerar respuesta"
                >
                    <RotateCcw size={14} className="group-active:-rotate-180 transition-transform duration-500" />
                    <span className="hidden xs:inline">Regenerar</span>
                </button>
            )}
        </div>
    );
}
