import { useState } from "react";
import { motion } from "framer-motion";
import {
    User,
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
    ArrowRight
} from "lucide-react";
import { SourceCard } from "./source-card";
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

function normalizeList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeStructured(answer: StructuredAnswer) {
    return {
        summary: typeof answer.summary === "string" ? answer.summary : "",
        foundation: normalizeList(answer.foundation),
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
    onOpenArticle?: (article: any) => void;
    onRegenerate?: () => void;
}) {
    const data = normalizeStructured(answer);
    const isComplex = !!data.legalInterpretation || data.relatedArticles.length > 0;
    const isSimple = data.scenarios.length === 0 && data.consequences.length === 0 && !isComplex;

    // Detect intent from field presence
    const isMulta = !!data.montoMinimo || !!data.montoMaximo || data.factoresAgravantes.length > 0;
    const isCalculo = data.pasos.length > 0 || !!data.formula;
    const isPlazo = !!data.fechaLimite || !!data.periodicidad;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-cyan-main uppercase tracking-widest">Sintesis</h4>
                <p className="text-text-main/90">{data.summary}</p>
            </div>

            {data.foundation.length > 0 && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-cyan-main uppercase tracking-widest">Fundamento principal</h4>
                    <div className="rounded-xl bg-bg-main/60 border border-border-glow/50 p-4 space-y-2">
                        {data.foundation.map((f, i) => (
                            <p key={i} className="text-sm text-text-main leading-relaxed flex gap-2">
                                <span className="text-cyan-glow opacity-60 mt-1">-</span> {f}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Intent: Multa */}
            {isMulta && <MultaView data={data} />}

            {/* Intent: Cálculo */}
            {isCalculo && <CalculoView data={data} />}

            {/* Intent: Plazo */}
            {isPlazo && <PlazoView data={data} />}

            {data.relatedArticles.length > 0 && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-amber-400/90 uppercase tracking-widest">Articulos relacionados</h4>
                    <div className="rounded-xl bg-amber-400/5 border border-amber-400/20 p-4 space-y-2">
                        {data.relatedArticles.map((art, i) => (
                            <p key={i} className="text-sm text-text-main leading-relaxed flex gap-2">
                                <span className="text-amber-400 opacity-60 mt-1">*</span> {art}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {data.legalInterpretation && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-purple-400/90 uppercase tracking-widest">Interpretacion legal</h4>
                    <div className="rounded-xl bg-purple-400/5 border border-purple-400/20 p-4">
                        <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">{data.legalInterpretation}</p>
                    </div>
                </div>
            )}

            {!isSimple && (data.scenarios.length > 0 || data.consequences.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {data.scenarios.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-text-sec uppercase tracking-widest">Escenarios / Requisitos</h4>
                            <ul className="space-y-1.5 list-none">
                                {data.scenarios.map((s, i) => (
                                    <li key={i} className="text-xs text-text-sec flex gap-2">
                                        <CheckCircle2 size={12} className="text-cyan-main mt-0.5 shrink-0" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.consequences.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-red-400/80 uppercase tracking-widest">Riesgos / Consecuencias</h4>
                            <ul className="space-y-1.5 list-none">
                                {data.consequences.map((c, i) => (
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
                        <span
                            className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                                data.certainty === "Muy Alta" || data.certainty === "Alta"
                                    ? "bg-green-400/5 text-green-400 border-green-400/20"
                                    : "bg-yellow-400/5 text-yellow-400 border-yellow-400/20"
                            )}
                        >
                            Certeza: {data.certainty}
                        </span>
                    </div>
                    <div className={cn("grid gap-3 mt-3", isSimple ? "grid-cols-1 sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
                        {sources.map((source) => (
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

            <MessageActions content={answer} onRegenerate={onRegenerate} />
        </div>
    );
}

// ─── Intent-Specific Card Components ────────────────────────────────────────

function MultaView({ data }: { data: ReturnType<typeof normalizeStructured> }) {
    const hasMonto = data.montoMinimo || data.montoMaximo;
    return (
        <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-widest">
                <DollarSign size={14} /> Multa / Sanción
            </h4>
            <div className="rounded-xl bg-amber-400/5 border border-amber-400/20 p-4 space-y-4">
                {hasMonto && (
                    <div className="flex flex-wrap gap-3">
                        {data.montoMinimo && (
                            <div className="flex-1 min-w-[120px] rounded-lg bg-amber-400/10 border border-amber-400/20 p-3 text-center">
                                <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider mb-1">Mínimo</p>
                                <p className="text-lg font-bold text-amber-300">{data.montoMinimo}</p>
                            </div>
                        )}
                        {data.montoMaximo && (
                            <div className="flex-1 min-w-[120px] rounded-lg bg-amber-400/10 border border-amber-400/20 p-3 text-center">
                                <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider mb-1">Máximo</p>
                                <p className="text-lg font-bold text-amber-300">{data.montoMaximo}</p>
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
            <h4 className="flex items-center gap-2 text-sm font-bold text-teal-400 uppercase tracking-widest">
                <Calculator size={14} /> Cálculo
            </h4>
            <div className="rounded-xl bg-teal-400/5 border border-teal-400/20 p-4 space-y-4">
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
                    <div className="rounded-lg bg-bg-main/60 border border-border-glow/30 p-3">
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
            <div className="rounded-xl bg-blue-400/5 border border-blue-400/20 p-4 space-y-4">
                <div className="flex flex-wrap gap-3">
                    {data.fechaLimite && (
                        <div className="flex-1 min-w-[160px] rounded-lg bg-blue-400/10 border border-blue-400/20 p-3">
                            <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider mb-1">Fecha Límite</p>
                            <p className="text-sm text-blue-200 font-semibold">{data.fechaLimite}</p>
                        </div>
                    )}
                    {data.periodicidad && (
                        <div className="flex-1 min-w-[120px] rounded-lg bg-blue-400/10 border border-blue-400/20 p-3">
                            <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider mb-1">Periodicidad</p>
                            <p className="text-sm text-blue-200 font-semibold">{data.periodicidad}</p>
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

        return `SINTESIS: ${normalized.summary}\n\nFUNDAMENTO: ${foundation}\n\nESCENARIOS: ${scenarios}\n\nCONSECUENCIAS: ${consequences}\n\nCERTEZA: ${normalized.certainty}`;
    };

    const buildHtmlReport = (data: StructuredAnswer) => {
        const normalized = normalizeStructured(data);

        const listHtml = (items: string[]) => {
            if (items.length === 0) return "<li>Sin datos</li>";
            return `<li>${items.join("</li><li>")}</li>`;
        };

        return `<h1>MYFISCAL - REPORTE DE CONSULTA</h1>
            <h3>Sintesis:</h3><p>${normalized.summary}</p>
            <h3>Fundamento:</h3><ul>${listHtml(normalized.foundation)}</ul>
            <h3>Escenarios:</h3><ul>${listHtml(normalized.scenarios)}</ul>
            <h3>Consecuencias:</h3><ul>${listHtml(normalized.consequences)}</ul>
            <p><b>Certeza:</b> ${normalized.certainty}</p>`;
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
            } catch (_err) {
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
