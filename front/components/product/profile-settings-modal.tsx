"use client";

import { useState } from "react";
import { 
    X, 
    Briefcase, 
    GraduationCap, 
    User, 
    MessageSquare, 
    Loader2,
    Shield,
    Sparkles,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfessionalProfile?: string | null;
    onSuccess: (newData: any) => void;
}

export function ProfileSettingsModal({ 
    isOpen, 
    onClose, 
    currentProfessionalProfile,
    onSuccess 
}: ProfileSettingsModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        professionalProfile: currentProfessionalProfile || "",
        expertiseLevel: "principiante",
        preferredTone: "explicativo",
        industryContext: "",
        additionalContext: ""
    });

    const expertiseOptions = [
        { value: "principiante", label: "Principiante", description: "Busco conceptos claros y sencillos" },
        { value: "intermedio", label: "Intermedio", description: "Conozco las bases, busco precisión" },
        { value: "experto", label: "Experto Fiscal / Contador", description: "Análisis técnico y fundamentos legales" }
    ];

    const toneOptions = [
        { value: "directo", label: "Directo y al grano", description: "Respuestas concisas y ejecutivas" },
        { value: "explicativo", label: "Explicativo / Didáctico", description: "Guía paso a paso con ejemplos" },
        { value: "tecnico", label: "Técnico / Legal", description: "Mención estricta de artículos y tesis" }
    ];

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error("Error al actualizar perfil");
            
            onSuccess(formData);
            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-bg-main/60 backdrop-blur-md"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl border border-border-glow bg-bg-card shadow-2xl scrollbar-hide"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-glow bg-bg-card/80 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-main/10 text-cyan-main">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main">Personaliza tu IA</h3>
                                    <p className="text-xs text-text-sec">Ajusta cómo MyFiscal analiza y responde a tus consultas.</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="rounded-xl p-2 text-text-sec hover:bg-bg-sec transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Personal Profile Row */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-text-main">
                                    <User size={16} className="text-cyan-main" />
                                    Tu Perfil Profesional
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {["Contador", "Abogado", "Empresario", "Estudiante", "Asesor", "Otro"].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setFormData({ ...formData, professionalProfile: p })}
                                            className={cn(
                                                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all border",
                                                formData.professionalProfile === p 
                                                ? "bg-cyan-main/10 border-cyan-main text-cyan-main shadow-sm" 
                                                : "bg-bg-sec border-border-glow text-text-sec hover:border-cyan-main/30"
                                            )}
                                        >
                                            {p}
                                            {formData.professionalProfile === p && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Expertise Level */}
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-text-main">
                                        <GraduationCap size={16} className="text-cyan-main" />
                                        Nivel de Conocimiento
                                    </label>
                                    <div className="space-y-2">
                                        {expertiseOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFormData({ ...formData, expertiseLevel: opt.value })}
                                                className={cn(
                                                    "w-full text-left rounded-2xl p-4 transition-all border",
                                                    formData.expertiseLevel === opt.value
                                                    ? "bg-cyan-main/10 border-cyan-main shadow-sm"
                                                    : "bg-bg-sec border-border-glow hover:border-cyan-main/30"
                                                )}
                                            >
                                                <p className={cn("text-sm font-bold", formData.expertiseLevel === opt.value ? "text-cyan-main" : "text-text-main")}>
                                                    {opt.label}
                                                </p>
                                                <p className="text-[10px] text-text-sec mt-1">{opt.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preferred Tone */}
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-text-main">
                                        <MessageSquare size={16} className="text-cyan-main" />
                                        Tono de Respuesta
                                    </label>
                                    <div className="space-y-2">
                                        {toneOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFormData({ ...formData, preferredTone: opt.value })}
                                                className={cn(
                                                    "w-full text-left rounded-2xl p-4 transition-all border",
                                                    formData.preferredTone === opt.value
                                                    ? "bg-cyan-main/10 border-cyan-main shadow-sm"
                                                    : "bg-bg-sec border-border-glow hover:border-cyan-main/30"
                                                )}
                                            >
                                                <p className={cn("text-sm font-bold", formData.preferredTone === opt.value ? "text-cyan-main" : "text-text-main")}>
                                                    {opt.label}
                                                </p>
                                                <p className="text-[10px] text-text-sec mt-1">{opt.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sector Context */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-text-main">
                                    <Briefcase size={16} className="text-cyan-main" />
                                    Sector o Régimen Principal
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="Ej. RESICO, Asalariado, Comercio Exterior..."
                                        value={formData.industryContext}
                                        onChange={(e) => setFormData({ ...formData, industryContext: e.target.value })}
                                        className="w-full rounded-2xl border border-border-glow bg-bg-sec px-5 py-3.5 text-sm text-text-main placeholder:text-text-sec outline-none focus:border-cyan-main/50 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Additional Context */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-text-main">
                                    <Shield size={16} className="text-cyan-main" />
                                    Contexto Adicional (Opcional)
                                </label>
                                <textarea 
                                    placeholder="Danos más detalles sobre tu situación o qué esperas del asistente..."
                                    value={formData.additionalContext}
                                    onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                                    className="w-full rounded-2xl border border-border-glow bg-bg-sec px-5 py-3 text-sm text-text-main placeholder:text-text-sec outline-none focus:border-cyan-main/50 transition-all min-h-[100px] resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 z-10 flex gap-3 border-t border-border-glow bg-bg-card/80 p-6 backdrop-blur-xl">
                            <button 
                                onClick={onClose}
                                className="flex-1 rounded-2xl border border-border-glow bg-bg-sec py-3.5 text-sm font-bold text-text-sec hover:bg-bg-main transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSaving || !formData.professionalProfile || !formData.industryContext}
                                className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-cyan-main py-3.5 text-sm font-bold text-bg-main hover:bg-cyan-glow transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-cyan-main/20"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    "Guardar Preferencias"
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
