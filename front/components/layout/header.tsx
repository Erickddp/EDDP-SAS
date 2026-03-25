"use client";

import { useEffect, useState } from "react";
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
    const mobileAvatarUrl = user?.googleAvatarUrl || user?.avatarUrl || "";
    const mobileDisplayName = user?.name?.trim() || "Cuenta activa";
    const mobileInitials = mobileDisplayName
        .split(" ")
        .map((part) => part[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

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
                        ? "border-b border-border-glow bg-bg-main/70 shadow-sm backdrop-blur-xl"
                        : "border-b border-transparent bg-bg-main/10 backdrop-blur-md"
                )}
            >
                <Container>
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border-glow bg-white p-2 shadow-sm dark:bg-bg-sec">
                                    <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain dark:hidden" />
                                    <img src="/icono2.png" alt="MyFiscal" className="hidden h-full w-full object-contain dark:block" />
                                </div>
                                <span className="hidden text-xl font-bold tracking-tight text-text-main sm:block">MyFiscal</span>
                            </Link>
                        </div>

                        <nav className="hidden items-center space-x-8 md:flex">
                            <Link href="/#como-funciona" className="text-sm font-medium text-text-sec transition-colors hover:text-cyan-main">
                                Como funciona
                            </Link>
                            <Link href="/#precios" className="text-sm font-medium text-text-sec transition-colors hover:text-cyan-main">
                                Precios
                            </Link>
                            <ThemeToggle />
                            {showAuthenticatedActions ? (
                                <div className="ml-4 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        {(user?.googleAvatarUrl || user?.avatarUrl) && (
                                            <img
                                                src={user?.googleAvatarUrl || user?.avatarUrl}
                                                alt={user?.name || "Usuario"}
                                                className="h-8 w-8 rounded-full border border-border-glow bg-bg-sec object-cover shadow-sm"
                                            />
                                        )}
                                        <span className="hidden text-sm font-semibold text-text-main lg:inline-block">{user?.name}</span>
                                    </div>
                                    <Link href="/chat">
                                        <Button variant="primary" size="sm" className="hidden bg-cyan-main text-bg-main shadow-lg shadow-cyan-main/20 transition-all hover:bg-cyan-glow sm:inline-flex">
                                            Ir a mis Chats
                                        </Button>
                                    </Link>
                                    <form action={logout}>
                                        <Button variant="ghost" size="sm" type="submit" className="text-text-sec transition-all hover:bg-red-950/20 hover:text-red-400">
                                            Salir
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                <div className="ml-4 flex items-center gap-3">
                                    <Link href={enterHref}>
                                        <Button variant="ghost" size="sm" className="text-text-sec hover:text-cyan-main">
                                            Iniciar sesion
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="primary" size="sm" className="bg-cyan-main text-bg-main shadow-md shadow-cyan-main/10 hover:bg-cyan-glow">
                                            Registrate
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </nav>

                        <div className="flex items-center gap-2 md:hidden">
                            {showAuthenticatedActions && (
                                <Link
                                    href="/account"
                                    className="inline-flex max-w-[150px] items-center gap-2 rounded-xl border border-border-glow bg-bg-sec/70 px-2.5 py-1.5 text-text-main backdrop-blur-md transition-colors hover:border-cyan-main/40"
                                >
                                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-glow bg-bg-main text-[11px] font-semibold">
                                        {mobileAvatarUrl ? (
                                            <img src={mobileAvatarUrl} alt={mobileDisplayName} className="h-full w-full object-cover" />
                                        ) : (
                                            mobileInitials
                                        )}
                                    </span>
                                    <span className="truncate text-xs font-semibold">{mobileDisplayName}</span>
                                </Link>
                            )}
                            <ThemeToggle compact />
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="rounded-xl border border-border-glow bg-bg-sec/70 p-2 text-text-sec backdrop-blur-md transition-colors hover:border-cyan-main/50 hover:text-text-main"
                                aria-label="Abrir menu"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </Container>
            </header>

            <MobileMenu isOpen={mobileMenuOpen} user={user} onClose={() => setMobileMenuOpen(false)} enterHref={enterHref} />
        </>
    );
}
