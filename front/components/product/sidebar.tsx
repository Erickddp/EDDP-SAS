"use client";

import { useState } from "react";
import { MessageSquare, Plus, PanelLeftClose, Archive, ArchiveRestore, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { UserProfileMenu } from "./user-profile-menu";
import { Button } from "../ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/types";
import { UserSession } from "@/lib/session";

interface SidebarProps {
    isOpen?: boolean;
    isMobile?: boolean;
    onToggle?: () => void;
    activeId?: string;
    onSelect?: (id: string) => void;
    onNew?: () => void;
    onArchive?: (id: string) => void;
    onRestore?: (id: string) => void;
    onDelete?: (id: string) => void;
    conversations: Conversation[];
    user?: UserSession | null;
}

export function Sidebar({
    isOpen = true,
    isMobile = false,
    onToggle,
    activeId,
    onSelect,
    onNew,
    onArchive,
    onRestore,
    onDelete,
    conversations = [],
    user
}: SidebarProps) {
    const [showArchived, setShowArchived] = useState(false);
    const activeConversations = conversations.filter((conversation) => !conversation.archived);
    const archivedConversations = conversations.filter((conversation) => conversation.archived);

    return (
        <aside
            className={cn(
                "border-r border-border-glow bg-bg-sec/80 backdrop-blur-xl transition-all duration-300",
                isMobile
                    ? cn(
                        "fixed inset-y-0 left-0 z-40 flex w-[86vw] max-w-80 flex-col shadow-2xl md:hidden",
                        isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
                    )
                    : cn(
                        "relative z-20 hidden overflow-hidden md:flex md:flex-col",
                        isOpen ? "md:w-72 md:opacity-100" : "md:w-0 md:opacity-0 md:pointer-events-none"
                    )
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 border-b border-border-glow shrink-0">
                {isOpen ? (
                    <Link href="/" className="flex items-center gap-2 px-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-bg-sec border border-border-glow shadow-sm overflow-hidden p-1.5">
                            <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain dark:hidden" />
                            <img src="/icono2.png" alt="MyFiscal" className="h-full w-full object-contain hidden dark:block" />
                        </div>
                        <span className="text-lg font-bold text-text-main">MyFiscal</span>
                    </Link>
                ) : (
                    <Link href="/" className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-bg-sec border border-border-glow shadow-sm hover:border-cyan-main/30 transition-all overflow-hidden p-1.5 shrink-0">
                        <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain dark:hidden" />
                        <img src="/icono2.png" alt="MyFiscal" className="h-full w-full object-contain hidden dark:block" />
                    </Link>
                )}
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="rounded-lg p-1.5 text-text-sec transition-all hover:bg-bg-sec/80 hover:text-text-main"
                        aria-label={isOpen ? "Cerrar barra lateral" : "Abrir barra lateral"}
                    >
                        {isOpen && <PanelLeftClose size={18} />}
                    </button>
                )}
            </div>

            <div className="p-4 flex-none">
                <Button
                    variant="outline"
                    onClick={onNew}
                    className={cn(
                        "w-full justify-start gap-2 shadow-[0_0_10px_rgba(32,196,255,0.05)] border-cyan-main/20 hover:border-cyan-main/50",
                        !isOpen ? "justify-center px-0 h-10 w-10 mx-auto" : ""
                    )}
                >
                    <Plus size={18} className={!isOpen ? "shrink-0" : ""} />
                    {isOpen && <span>Nueva consulta</span>}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-border-glow">
                {isOpen && (
                    <>
                        {conversations.length > 0 && (
                            <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-sec">
                                Historial de consultas
                            </h3>
                        )}

                        {conversations.length === 0 && (
                            <div className="px-6 py-10 text-center">
                                <p className="text-xs text-text-sec opacity-60">No hay consultas guardadas</p>
                            </div>
                        )}

                        {conversations.length > 0 && (
                            <div className="mb-3">
                                <button
                                    onClick={() => setShowArchived((current) => !current)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-sec/80 transition-colors hover:bg-bg-sec hover:text-text-main"
                                    aria-expanded={showArchived}
                                >
                                    {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span>Archivados</span>
                                </button>

                                {showArchived && archivedConversations.length > 0 && (
                                    <div className="mt-1 space-y-1">
                                        {archivedConversations.map((conv) => (
                                            <div
                                                key={conv.id}
                                                className="group flex w-full items-center gap-3 rounded-lg border border-transparent py-2.5 px-3 text-sm text-text-sec/90 transition-all hover:bg-bg-sec"
                                            >
                                                <button
                                                    onClick={() => onSelect?.(conv.id)}
                                                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                                >
                                                    <MessageSquare size={16} className="text-text-sec/70" />
                                                    <span className="truncate flex-1 font-medium">{conv.title}</span>
                                                </button>
                                                <button
                                                    onClick={() => onRestore?.(conv.id)}
                                                    className="rounded-md p-1.5 text-text-sec hover:bg-bg-main hover:text-cyan-main transition-colors"
                                                    title="Restaurar chat"
                                                >
                                                    <ArchiveRestore size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete?.(conv.id)}
                                                    className="rounded-md p-1.5 text-text-sec hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                    title="Eliminar chat"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                <nav className="space-y-1">
                    {activeConversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={cn(
                                "group flex w-full items-center gap-3 rounded-xl py-2.5 text-sm transition-all border",
                                isOpen ? "px-3" : "justify-center px-0 hover:bg-bg-sec/80 h-10 w-10 mx-auto",
                                activeId === conv.id
                                    ? "bg-cyan-main/10 text-cyan-main border-cyan-main/20"
                                    : "text-text-sec hover:bg-bg-sec hover:text-cyan-main border-transparent"
                            )}
                            title={!isOpen ? conv.title : undefined}
                        >
                            <button
                                onClick={() => onSelect?.(conv.id)}
                                className={cn(
                                    "flex min-w-0 items-center gap-3 text-left",
                                    isOpen ? "flex-1" : "h-10 w-10 justify-center"
                                )}
                            >
                                <MessageSquare size={16} className={cn(
                                    "shrink-0",
                                    activeId === conv.id ? "text-cyan-main" : "text-text-sec group-hover:text-cyan-main"
                                )} />
                                {isOpen && <span className={cn("truncate flex-1", activeId === conv.id ? "font-bold" : "font-medium")}>{conv.title}</span>}
                            </button>
                            {isOpen && (
                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button
                                        onClick={() => onArchive?.(conv.id)}
                                        className="rounded-md p-1.5 text-text-sec hover:bg-bg-main hover:text-cyan-main transition-colors"
                                        title="Archivar chat"
                                    >
                                        <Archive size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(conv.id)}
                                        className="rounded-md p-1.5 text-text-sec hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                        title="Eliminar chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className={cn("mt-auto border-t border-border-glow flex flex-col gap-2 transition-all p-3", !isOpen ? "items-center" : "")}>
                {/* Subscription Banner (Conditional) */}
                {(!user || (user.plan !== 'pro' && user.plan !== 'despacho' && user.plan !== 'basic')) && (
                    <div className={cn(
                        "rounded-xl border border-cyan-main/20 bg-cyan-main/5 relative overflow-hidden transition-all duration-300",
                        isOpen ? "p-4" : "h-1 w-full bg-cyan-main/10 border-none p-0 overflow-hidden opacity-30"
                    )}>
                        {isOpen && (
                            <>
                                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-main/10 blur-xl rounded-full" aria-hidden="true" />
                                <div className="text-[10px] font-bold text-cyan-main mb-1 uppercase tracking-widest opacity-80">Edición Beta</div>
                                <h4 className="text-sm font-bold text-text-main mb-2">
                                    {user && user.role !== 'guest' ? `Plan ${user.plan || 'Gratis'}` : 'Acceso Gratuito'}
                                </h4>
                                {(!user || user.role === 'guest') && (
                                    <>
                                        <p className="text-[10px] text-text-sec mb-3 leading-relaxed">
                                            Límite de 5 consultas. Regístrate para acceso ilimitado.
                                        </p>
                                        <Link href="/register" className="w-full">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="w-full text-[10px] h-7 shadow-sm transition-all uppercase font-black tracking-tighter"
                                            >
                                                Registrarse Gratis
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Identity Hub */}
                <UserProfileMenu
                    user={user || null}
                    isCollapsed={!isOpen}
                    triggerVariant="settings"
                    menuPlacement={!isOpen ? "right" : "top"}
                />
            </div>
        </aside>
    );
}
