"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface MobileMenuProps {
    isOpen: boolean;
    user?: any;
    onClose: () => void;
    enterHref?: string;
}

export function MobileMenu({ isOpen, user, onClose, enterHref = "/login" }: MobileMenuProps) {
    const hasSession = Boolean(user);
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-bg-main/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border-glow bg-bg-sec p-6 shadow-xl"
                    >
                        <div className="mb-8 flex items-center justify-between">
                            <span className="text-xl font-bold text-text-main">
                                My<span className="text-cyan-main">Fiscal</span>
                            </span>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-text-sec transition-colors hover:bg-bg-main hover:text-text-main"
                                aria-label="Cerrar menú"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-6">
                            <Link
                                href="#como-funciona"
                                className="text-lg font-medium text-text-sec transition-colors hover:text-cyan-main"
                                onClick={onClose}
                            >
                                Cómo funciona
                            </Link>
                            <Link
                                href="#precios"
                                className="text-lg font-medium text-text-sec transition-colors hover:text-cyan-main"
                                onClick={onClose}
                            >
                                Precios
                            </Link>
                            <Link
                                href="/chat"
                                className="text-lg font-medium text-text-sec transition-colors hover:text-cyan-main"
                                onClick={onClose}
                            >
                                Chat
                            </Link>
                            <Link
                                href="/account"
                                className="text-lg font-medium text-text-sec transition-colors hover:text-cyan-main"
                                onClick={onClose}
                            >
                                Mi Cuenta
                            </Link>
                            <div className="h-px w-full bg-border-glow" />
                            {hasSession ? (
                                <Link href="/chat" onClick={onClose}>
                                    <Button variant="primary" className="w-full bg-cyan-main text-bg-main">
                                        Ir a mis Chats
                                    </Button>
                                </Link>
                            ) : (
                                <Link href={enterHref} onClick={onClose}>
                                    <Button variant="primary" className="w-full bg-cyan-main text-bg-main">
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                            )}
                        </nav>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
