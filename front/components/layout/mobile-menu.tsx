"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { LogOut, UserRound, X } from "lucide-react";
import { logout } from "@/lib/auth";
import type { UserSession } from "@/lib/session";
import { Button } from "../ui/button";

interface MobileMenuProps {
    isOpen: boolean;
    user?: UserSession | null;
    onClose: () => void;
    enterHref?: string;
}

export function MobileMenu({ isOpen, user, onClose, enterHref = "/login" }: MobileMenuProps) {
    const hasSession = Boolean(user);
    const avatarUrl = user?.googleAvatarUrl || user?.avatarUrl || "";
    const name = user?.name?.trim() || "Usuario activo";
    const email = user?.email || "Sesion iniciada";
    const plan = user?.plan ? `Plan ${user.plan}` : "Plan gratis";
    const initials = name
        .split(" ")
        .map((part) => part[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-bg-main/70 backdrop-blur-sm"
                    />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 26, stiffness: 240 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border-glow bg-bg-sec/90 p-5 shadow-2xl backdrop-blur-2xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <span className="text-xl font-bold text-text-main">
                                My<span className="text-cyan-main">Fiscal</span>
                            </span>
                            <button
                                onClick={onClose}
                                className="rounded-full border border-border-glow p-2 text-text-sec transition-colors hover:border-cyan-main/40 hover:text-text-main"
                                aria-label="Cerrar menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {hasSession && (
                            <div className="mb-6 rounded-2xl border border-border-glow bg-bg-main/55 p-4">
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border-glow bg-bg-sec text-sm font-semibold text-text-main">
                                        {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-text-main">{name}</p>
                                        <p className="truncate text-xs text-text-sec">{email}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <span className="rounded-full border border-cyan-main/25 bg-cyan-main/10 px-2.5 py-1 text-[11px] font-medium text-cyan-main">
                                        Sesion activa
                                    </span>
                                    <span className="truncate text-[11px] text-text-sec">{plan}</span>
                                </div>
                            </div>
                        )}

                        <nav className="flex flex-col gap-2">
                            <Link
                                href="/#como-funciona"
                                className="rounded-xl px-3 py-2 text-base font-medium text-text-sec transition-colors hover:bg-bg-main/60 hover:text-cyan-main"
                                onClick={onClose}
                            >
                                Como funciona
                            </Link>
                            <Link
                                href="/#precios"
                                className="rounded-xl px-3 py-2 text-base font-medium text-text-sec transition-colors hover:bg-bg-main/60 hover:text-cyan-main"
                                onClick={onClose}
                            >
                                Precios
                            </Link>
                            <Link
                                href="/chat"
                                className="rounded-xl px-3 py-2 text-base font-medium text-text-sec transition-colors hover:bg-bg-main/60 hover:text-cyan-main"
                                onClick={onClose}
                            >
                                Chat
                            </Link>
                            {hasSession && (
                                <Link
                                    href="/account"
                                    className="rounded-xl px-3 py-2 text-base font-medium text-text-sec transition-colors hover:bg-bg-main/60 hover:text-cyan-main"
                                    onClick={onClose}
                                >
                                    Mi cuenta
                                </Link>
                            )}
                        </nav>

                        <div className="mt-6 border-t border-border-glow pt-5">
                            {hasSession ? (
                                <div className="space-y-3">
                                    <Link href="/chat" onClick={onClose}>
                                        <Button variant="primary" className="w-full bg-cyan-main text-bg-main hover:bg-cyan-glow">
                                            Ir a mis Chats
                                        </Button>
                                    </Link>
                                    <Link href="/account" onClick={onClose}>
                                        <Button variant="secondary" className="w-full">
                                            <UserRound size={16} className="mr-2" />
                                            Ver mi cuenta
                                        </Button>
                                    </Link>
                                    <form action={logout}>
                                        <Button variant="ghost" type="submit" className="w-full justify-center text-text-sec hover:bg-red-950/20 hover:text-red-400">
                                            <LogOut size={16} className="mr-2" />
                                            Cerrar sesion
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Link href={enterHref} onClick={onClose}>
                                        <Button variant="primary" className="w-full bg-cyan-main text-bg-main hover:bg-cyan-glow">
                                            Iniciar sesion
                                        </Button>
                                    </Link>
                                    <Link href="/register" onClick={onClose}>
                                        <Button variant="secondary" className="w-full">
                                            Crear cuenta
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
