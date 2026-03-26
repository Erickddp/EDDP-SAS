"use client";

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
        <div className="mb-2.5 grid gap-1.5 md:flex md:items-stretch md:gap-2.5">
            <ControlGroup label="Tono" icon={Type}>
                <div className="grid grid-cols-2 gap-1">
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
                <div className="grid grid-cols-3 gap-1">
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
        <div className="rounded-xl border border-border-glow/60 bg-bg-sec/80 p-1.5 shadow-md backdrop-blur-xl md:flex-1 md:rounded-2xl md:p-2">
            <div className="mb-1.5 flex items-center gap-1.5 px-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-text-sec/55 md:mb-2 md:px-1 md:text-[10px]">
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
                "relative flex min-h-9 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center transition-all duration-200",
                isSelected
                    ? "border border-cyan-main/35 bg-cyan-main/12 text-text-main ring-1 ring-cyan-main/20"
                    : "border border-transparent text-text-sec hover:border-border-glow hover:bg-bg-sec/70 hover:text-text-main"
            )}
        >
            <Icon
                size={13}
                strokeWidth={isSelected ? 2.5 : 2}
                className={cn(
                    "transition-colors duration-200",
                    isSelected ? "text-cyan-main" : "opacity-70"
                )}
            />
            <span className={cn("text-[11px] leading-none", isSelected ? "font-semibold" : "font-medium")}>
                {label}
            </span>
        </button>
    );
}

