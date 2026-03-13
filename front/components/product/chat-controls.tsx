"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
    Smile, 
    Scale, 
    Circle, 
    MoreHorizontal, 
    Layers,
    Type
} from "lucide-react";
import { ChatMode, DetailLevel } from "@/lib/types";

interface ChatControlsProps {
    mode: ChatMode;
    detail: DetailLevel;
    onModeChange: (mode: ChatMode) => void;
    onDetailChange: (level: DetailLevel) => void;
}

export function ChatControls({
    mode,
    detail,
    onModeChange,
    onDetailChange
}: ChatControlsProps) {
    
    const modes: { id: ChatMode; label: string; icon: any }[] = [
        { id: "casual", label: "Casual", icon: Smile },
        { id: "profesional", label: "Profesional", icon: Scale },
    ];

    const details: { id: DetailLevel; label: string; icon: any }[] = [
        { id: "sencilla", label: "Sencilla", icon: Circle },
        { id: "detallada", label: "Detallada", icon: MoreHorizontal },
        { id: "tecnica", label: "Técnica", icon: Layers },
    ];

    return (
        <div className="flex items-center gap-3 mt-2 mb-3 px-1 overflow-x-auto scrollbar-none whitespace-nowrap pb-1">
            {/* Tono Controls */}
            <div className="flex items-center gap-1 rounded-xl bg-bg-sec/80 border border-border-glow/60 p-1.5 backdrop-blur-xl shadow-md group transition-all hover:border-border-glow">
                <div className="px-2 py-1 text-[10px] font-bold text-text-sec uppercase tracking-tighter opacity-50 flex items-center gap-1">
                    <Type size={10} />
                    <span>Tono</span>
                </div>
                <div className="h-4 w-px bg-border-glow mx-1 opacity-50" />
                {modes.map((m) => (
                    <OptionButton
                        key={m.id}
                        isSelected={mode === m.id}
                        onClick={() => onModeChange(m.id)}
                        icon={m.icon}
                        label={m.label}
                        tooltip={`Modo ${m.label}`}
                    />
                ))}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-border-glow/40 mx-1 hidden sm:block" />

            {/* Profundidad Controls */}
            <div className="flex items-center gap-1 rounded-xl bg-bg-sec/80 border border-border-glow/60 p-1.5 backdrop-blur-xl shadow-md transition-all hover:border-border-glow">
                <div className="px-2 py-1 text-[10px] font-bold text-text-sec uppercase tracking-tighter opacity-50 flex items-center gap-1">
                    <Layers size={10} />
                    <span>Nivel</span>
                </div>
                <div className="h-4 w-px bg-border-glow mx-1 opacity-50" />
                {details.map((d) => (
                    <OptionButton
                        key={d.id}
                        isSelected={detail === d.id}
                        onClick={() => onDetailChange(d.id)}
                        icon={d.icon}
                        label={d.label}
                        tooltip={`Respuesta ${d.label}`}
                    />
                ))}
            </div>
        </div>
    );
}

function OptionButton({ 
    isSelected, 
    onClick, 
    icon: Icon, 
    label,
    tooltip 
}: { 
    isSelected: boolean; 
    onClick: () => void; 
    icon: any; 
    label: string;
    tooltip: string;
}) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={cn(
                "relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-300 group/btn",
                isSelected 
                    ? "bg-cyan-main/15 text-text-main border border-cyan-main/40 shadow-[0_0_15px_rgba(32,196,255,0.15)] ring-1 ring-cyan-main/20" 
                    : "text-text-sec hover:text-text-main hover:bg-bg-sec/80"
            )}
        >
            <Icon size={14} strokeWidth={isSelected ? 2.5 : 2} className={cn("transition-all duration-300", isSelected ? "scale-110 text-cyan-main" : "opacity-70 group-hover/btn:opacity-100")} />
            
            <AnimatePresence initial={false}>
                {isSelected && (
                    <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="overflow-hidden whitespace-nowrap text-xs font-semibold tracking-tight"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Hover Indicator for non-selected */}
            {!isSelected && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-bg-main border border-border-glow rounded text-[10px] text-text-main opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                    {label}
                </div>
            )}
        </button>
    );
}
