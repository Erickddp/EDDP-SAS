"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, PanelLeftClose, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/types";

interface SidebarProps {
    isOpen?: boolean;
    onToggle?: () => void;
    activeId?: string;
    onSelect?: (id: string) => void;
    onNew?: () => void;
    conversations: Conversation[];
}

export function Sidebar({
    isOpen = true,
    onToggle,
    activeId,
    onSelect,
    onNew,
    conversations = []
}: SidebarProps) {
    const [joinedPro, setJoinedPro] = useState(false);

    return (
        <aside
            className={cn(
                "flex-col border-r border-border-glow bg-bg-sec/50 backdrop-blur-xl transition-all duration-300 z-20",
                isOpen ? "w-72 flex" : "w-0 hidden md:flex md:w-20"
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 border-b border-border-glow">
                {isOpen && (
                    <Link href="/" className="flex items-center gap-2 px-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-main/10 border border-cyan-main/30">
                            <span className="text-sm font-bold text-cyan-glow">MF</span>
                        </div>
                        <span className="text-lg font-bold text-text-main">MyFiscal</span>
                    </Link>
                )}
                {!isOpen && (
                    <Link href="/" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-main/10 border border-cyan-main/30 hover:bg-cyan-main/20 transition-colors">
                        <span className="text-sm font-bold text-cyan-glow">MF</span>
                    </Link>
                )}
                {onToggle && isOpen && (
                    <button
                        onClick={onToggle}
                        className="md:hidden text-text-sec hover:text-text-main p-1 transition-colors"
                        aria-label="Cerrar barra lateral"
                    >
                        <PanelLeftClose size={20} />
                    </button>
                )}
            </div>

            <div className="p-4 flex-none">
                <Button
                    variant="outline"
                    onClick={onNew}
                    className={cn(
                        "w-full justify-start gap-2 shadow-[0_0_10px_rgba(32,196,255,0.05)] border-cyan-main/20 hover:border-cyan-main/50",
                        !isOpen ? "justify-center px-0" : ""
                    )}
                >
                    <Plus size={18} className={!isOpen ? "mx-auto" : ""} />
                    {isOpen && <span>Nueva consulta</span>}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-border-glow">
                {isOpen && conversations.length > 0 && (
                    <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-sec">
                        Historial de consultas
                    </h3>
                )}

                {conversations.length === 0 && isOpen && (
                    <div className="px-6 py-10 text-center">
                        <p className="text-xs text-text-sec opacity-60">No hay consultas guardadas</p>
                    </div>
                )}

                <nav className="space-y-1">
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelect?.(conv.id)}
                            className={cn(
                                "group flex w-full items-center gap-3 rounded-lg py-2.5 text-sm transition-all",
                                isOpen ? "px-3" : "justify-center px-0 hover:bg-bg-sec/80",
                                activeId === conv.id
                                    ? "bg-cyan-main/10 text-cyan-main border border-cyan-main/20"
                                    : "text-text-sec hover:bg-bg-sec hover:text-cyan-main border border-transparent"
                            )}
                            title={!isOpen ? conv.title : undefined}
                        >
                            <MessageSquare size={16} className={activeId === conv.id ? "text-cyan-main" : "text-text-sec group-hover:text-cyan-main"} />
                            {isOpen && <span className="truncate flex-1 text-left">{conv.title}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            <div className={cn("mt-auto border-t border-border-glow p-4", !isOpen ? "hidden md:flex justify-center" : "")}>
                <div className={cn(
                    "rounded-xl border border-cyan-main/20 bg-cyan-main/5 relative overflow-hidden transition-all duration-300",
                    isOpen ? "p-4" : "p-2 opacity-70 hover:opacity-100 flex justify-center w-full cursor-pointer"
                )}>
                    {isOpen && (
                        <>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-main/10 blur-xl rounded-full" aria-hidden="true" />
                            <div className="text-[10px] font-bold text-cyan-main mb-1 uppercase tracking-widest opacity-80">Edición Beta</div>
                            <h4 className="text-base font-bold text-text-main mb-3">Acceso Gratuito</h4>
                            <Button 
                                variant={joinedPro ? "outline" : "primary"} 
                                size="sm" 
                                className={cn(
                                    "w-full text-xs h-8 shadow-sm transition-all",
                                    joinedPro ? "bg-green-400/10 border-green-400/30 text-green-400 hover:bg-green-400/20" : ""
                                )}
                                onClick={() => setJoinedPro(true)}
                                disabled={joinedPro}
                            >
                                {joinedPro ? (
                                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> ¡Anotado en lista!</span>
                                ) : "Unirse a la Pro"}
                            </Button>
                        </>
                    )}
                    {!isOpen && (
                        <div className="text-[10px] font-bold text-cyan-main text-center">BETA</div>
                    )}
                </div>
            </div>
        </aside>
    );
}
