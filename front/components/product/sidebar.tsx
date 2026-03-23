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
    const isNonProPlan = !user || (user.plan !== "pro" && user.plan !== "despacho" && user.plan !== "basic");

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
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-glow px-4">
                {isOpen ? (
                    <Link href="/" className="flex items-center gap-2 px-2">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-border-glow bg-white p-1.5 shadow-sm dark:bg-bg-sec">
                            <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain dark:hidden" />
                            <img src="/icono2.png" alt="MyFiscal" className="hidden h-full w-full object-contain dark:block" />
                        </div>
                        <span className="text-lg font-bold text-text-main">MyFiscal</span>
                    </Link>
                ) : (
                    <Link href="/" className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-glow bg-white p-1.5 shadow-sm transition-all hover:border-cyan-main/30 dark:bg-bg-sec">
                        <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain dark:hidden" />
                        <img src="/icono2.png" alt="MyFiscal" className="hidden h-full w-full object-contain dark:block" />
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

            <div className="flex-none p-4">
                <Button
                    variant="outline"
                    onClick={onNew}
                    className={cn(
                        "w-full justify-start gap-2 border-cyan-main/20 shadow-[0_0_10px_rgba(32,196,255,0.05)] hover:border-cyan-main/50",
                        !isOpen ? "mx-auto h-10 w-10 justify-center px-0" : ""
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
                                                className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-text-sec/90 transition-all hover:bg-bg-sec"
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
                                                    className="rounded-md p-1.5 text-text-sec transition-colors hover:bg-bg-main hover:text-cyan-main"
                                                    title="Restaurar chat"
                                                >
                                                    <ArchiveRestore size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete?.(conv.id)}
                                                    className="rounded-md p-1.5 text-text-sec transition-colors hover:bg-red-500/10 hover:text-red-400"
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
                                "group flex w-full items-center gap-3 rounded-xl border py-2.5 text-sm transition-all",
                                isOpen ? "px-3" : "mx-auto h-10 w-10 justify-center px-0 hover:bg-bg-sec/80",
                                activeId === conv.id
                                    ? "border-cyan-main/20 bg-cyan-main/10 text-cyan-main"
                                    : "border-transparent text-text-sec hover:bg-bg-sec hover:text-cyan-main"
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
                                <MessageSquare
                                    size={16}
                                    className={cn(
                                        "shrink-0",
                                        activeId === conv.id ? "text-cyan-main" : "text-text-sec group-hover:text-cyan-main"
                                    )}
                                />
                                {isOpen && (
                                    <span className={cn("truncate flex-1", activeId === conv.id ? "font-bold" : "font-medium")}>
                                        {conv.title}
                                    </span>
                                )}
                            </button>

                            {isOpen && (
                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button
                                        onClick={() => onArchive?.(conv.id)}
                                        className="rounded-md p-1.5 text-text-sec transition-colors hover:bg-bg-main hover:text-cyan-main"
                                        title="Archivar chat"
                                    >
                                        <Archive size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(conv.id)}
                                        className="rounded-md p-1.5 text-text-sec transition-colors hover:bg-red-500/10 hover:text-red-400"
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

            <div className={cn("mt-auto flex flex-col gap-2 border-t border-border-glow p-3 transition-all", !isOpen ? "items-center" : "")}>
                {isNonProPlan && (
                    <div
                        className={cn(
                            "relative overflow-hidden rounded-xl border border-cyan-main/20 bg-cyan-main/5 transition-all duration-300",
                            isOpen ? "p-4" : "h-1 w-full overflow-hidden border-none bg-cyan-main/10 p-0 opacity-30"
                        )}
                    >
                        {isOpen && (
                            <>
                                <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-cyan-main/10 blur-xl" aria-hidden="true" />
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-main opacity-80">Edicion beta</div>
                                <h4 className="mb-2 text-sm font-bold text-text-main">
                                    {user && user.role !== "guest" ? `Plan ${user.plan || "Gratis"}` : "Acceso gratuito"}
                                </h4>
                                <p className="mb-3 text-[10px] leading-relaxed text-text-sec">
                                    Sube a Pro para mas consultas y mayor respaldo en cada analisis.
                                </p>
                                <Link href="/dashboard/billing" className="w-full">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="h-7 w-full text-[10px] font-black uppercase tracking-tighter shadow-sm transition-all"
                                    >
                                        Subir a Pro
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                )}

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
