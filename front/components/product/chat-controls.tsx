"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Smile,
    Scale,
    Circle,
    MoreHorizontal,
    Layers,
    Type,
    type LucideIcon
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
    const modes: { id: ChatMode; label: string; icon: LucideIcon }[] = [
        { id: "casual", label: "Casual", icon: Smile },
        { id: "profesional", label: "Profesional", icon: Scale },
    ];

    const details: { id: DetailLevel; label: string; icon: LucideIcon }[] = [
        { id: "sencilla", label: "Sencilla", icon: Circle },
        { id: "detallada", label: "Detallada", icon: MoreHorizontal },
        { id: "tecnica", label: "Tecnica", icon: Layers },
    ];

    return (
        <div className="mb-3 grid gap-2 sm:flex sm:items-center sm:gap-3">
            <ControlGroup label="Tono" icon={Type}>
                <div className="grid flex-1 grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
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
            </ControlGroup>

            <ControlGroup label="Nivel" icon={Layers}>
                <div className="grid flex-1 grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
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
            </ControlGroup>
        </div>
    );
}

function ControlGroup({
    label,
    icon: Icon,
    children
}: {
    label: string;
    icon: LucideIcon;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-border-glow/70 bg-bg-sec/85 p-2 shadow-md backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-sec/60">
                <Icon size={11} />
                <span>{label}</span>
            </div>
            {children}
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
    icon: LucideIcon;
    label: string;
    tooltip: string;
}) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={cn(
                "relative flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-center transition-all duration-300 group/btn sm:min-h-0 sm:justify-start sm:rounded-lg sm:py-1.5",
                isSelected
                    ? "border border-cyan-main/40 bg-cyan-main/15 text-text-main shadow-[0_0_15px_rgba(32,196,255,0.15)] ring-1 ring-cyan-main/20"
                    : "text-text-sec hover:bg-bg-sec/80 hover:text-text-main"
            )}
        >
            <Icon
                size={14}
                strokeWidth={isSelected ? 2.5 : 2}
                className={cn(
                    "transition-all duration-300",
                    isSelected ? "scale-110 text-cyan-main" : "opacity-70 group-hover/btn:opacity-100"
                )}
            />
            <span className="text-[11px] font-semibold leading-none sm:hidden">{label}</span>

            <AnimatePresence initial={false}>
                {isSelected && (
                    <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="hidden overflow-hidden whitespace-nowrap text-xs font-semibold tracking-tight sm:inline-block"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>

            {!isSelected && (
                <div className="pointer-events-none absolute -top-8 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded border border-border-glow bg-bg-main px-2 py-1 text-[10px] text-text-main opacity-0 shadow-xl transition-opacity group-hover/btn:opacity-100 sm:block">
                    {label}
                </div>
            )}
        </button>
    );
}

