"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Container } from "./container";
import { Button } from "../ui/button";
import { MobileMenu } from "./mobile-menu";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import type { UserSession } from "@/lib/session";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface HeaderProps {
    user?: UserSession | null;
    forceGuestView?: boolean;
    hasSession?: boolean;
}

export function Header({ user, forceGuestView = false, hasSession = false }: HeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const showAuthenticatedActions = Boolean(user) && !forceGuestView;
    const enterHref = hasSession ? "/chat" : "/login";

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 z-30 w-full transition-all duration-300",
                    isScrolled
                        ? "bg-bg-main/80 shadow-sm backdrop-blur-lg border-b border-border-glow"
                        : "bg-transparent"
                )}
            >
                <Container>
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-glow bg-white dark:bg-bg-sec shadow-sm overflow-hidden p-2">
                                    <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain" />
                                </div>
                                <span className="hidden text-xl font-bold tracking-tight text-text-main sm:block">
                                    MyFiscal
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden items-center space-x-8 md:flex">
                            <Link href="/#como-funciona" className="text-sm font-medium text-text-sec transition-colors hover:text-cyan-main">
                                Cómo funciona
                            </Link>
                            <Link href="/#precios" className="text-sm font-medium text-text-sec transition-colors hover:text-cyan-main">
                                Precios
                            </Link>
                            <ThemeToggle />
                            {showAuthenticatedActions ? (
                                <div className="flex items-center gap-4 ml-4">
                                    <span className="text-sm text-text-sec">
                                        {user?.role === 'guest' 
                                            ? `Invitado (${user.questionCount || 0}/2)` 
                                            : user?.name}
                                    </span>
                                    <Link href="/account">
                                        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                                            Mi Cuenta
                                        </Button>
                                    </Link>
                                    <Link href="/chat">
                                        <Button variant="outline" size="sm">
                                            Ir al Chat
                                        </Button>
                                    </Link>
                                    <form action={logout}>
                                        <Button variant="ghost" size="sm" type="submit" className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                                            Salir
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 ml-4">
                                    <Link href={enterHref}>
                                        <Button variant="ghost" size="sm">
                                            Entrar
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="outline" size="sm">
                                            Registrarse
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </nav>

                        {/* Mobile Nav Toggle */}
                        <div className="md:hidden flex items-center gap-2">
                            <ThemeToggle compact />
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="rounded-lg p-2 text-text-sec transition-colors hover:bg-bg-sec hover:text-text-main"
                                aria-label="Abrir menú"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </Container>
            </header>

            <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} enterHref={enterHref} />
        </>
    );
}
