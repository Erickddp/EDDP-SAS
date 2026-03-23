"use client";

import { useEffect, useRef, useState } from "react";
import {
    Settings,
    LogOut,
    Shield,
    FileText,
    ChevronUp,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSession } from "@/lib/session";
import Link from "next/link";

interface UserProfileMenuProps {
    user: UserSession | null;
    isCollapsed?: boolean;
    triggerVariant?: "avatar" | "settings";
    menuPlacement?: "top" | "right" | "bottom-right";
    className?: string;
    buttonClassName?: string;
}

export function UserProfileMenu({
    user,
    isCollapsed = false,
    triggerVariant = "settings",
    menuPlacement = "top",
    className,
    buttonClassName
}: UserProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const avatarUrl = user.googleAvatarUrl || user.avatarUrl || "";
    const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "US";
    const isAvatarTrigger = triggerVariant === "avatar";

    const menuPositionClass = (() => {
        if (menuPlacement === "bottom-right") {
            return "right-0 top-full mt-2";
        }

        if (menuPlacement === "right") {
            return "left-12 bottom-0";
        }

        return isCollapsed ? "left-12 bottom-0 mb-0" : "bottom-full left-0 mb-2";
    })();

    return (
        <div className={cn("relative", isAvatarTrigger ? "w-auto" : "w-full", className)} ref={menuRef}>
            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 w-64 overflow-hidden rounded-2xl border border-border-glow bg-bg-card shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200",
                        menuPositionClass
                    )}
                >
                    <div className="border-b border-border-glow/50 bg-cyan-main/5 p-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-cyan-main/30 bg-bg-sec">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-cyan-main">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-text-main">{user.name}</p>
                                <p className="truncate text-[10px] text-text-sec opacity-70">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-1.5">
                        <MenuItem icon={<Settings size={14} />} label="Ajustes" href="/account" />
                        {user.plan === "gratis" && (
                            <MenuItem
                                icon={<Sparkles size={14} className="text-cyan-main" />}
                                label="Subir a Pro"
                                href="/pricing"
                                className="font-bold text-cyan-main"
                            />
                        )}
                        <div className="mx-2 my-1 h-px bg-border-glow/30" />
                        <MenuItem icon={<Shield size={14} />} label="Privacidad" href="/privacy" />
                        <MenuItem icon={<FileText size={14} />} label="Terminos" href="/terms" />
                        <div className="mx-2 my-1 h-px bg-border-glow/30" />
                        <button
                            onClick={() => { window.location.href = "/api/auth/logout"; }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-400/10"
                        >
                            <LogOut size={14} />
                            <span>Cerrar Sesion</span>
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen((current) => !current)}
                className={cn(
                    "group transition-all",
                    isAvatarTrigger
                        ? "inline-flex items-center justify-center"
                        : "flex w-full items-center gap-3 rounded-2xl p-2",
                    !isAvatarTrigger && (isOpen ? "bg-bg-sec/80 ring-1 ring-border-glow shadow-md" : "hover:bg-bg-sec/50"),
                    !isAvatarTrigger && !isCollapsed ? "px-3" : "",
                    !isAvatarTrigger && isCollapsed ? "justify-center" : "",
                    buttonClassName
                )}
                aria-label={isAvatarTrigger ? "Abrir menu de cuenta" : "Abrir ajustes y cuenta"}
                title={isAvatarTrigger ? "Cuenta" : "Ajustes y cuenta"}
            >
                {isAvatarTrigger ? (
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-border-glow bg-bg-sec shadow-lg transition-transform group-hover:scale-105 md:h-11 md:w-11">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-cyan-main">
                                {initials}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div
                            className={cn(
                                "relative flex shrink-0 items-center justify-center rounded-xl border border-border-glow bg-white text-text-sec shadow-sm transition-all group-hover:scale-105 group-hover:text-text-main dark:bg-bg-sec",
                                isCollapsed ? "h-10 w-10" : "h-9 w-9",
                                isOpen ? "border-cyan-main/30 text-cyan-main ring-1 ring-cyan-main/20" : ""
                            )}
                        >
                            <Settings size={isCollapsed ? 18 : 17} />
                            <span
                                className={cn(
                                    "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-bg-sec bg-cyan-main transition-opacity",
                                    isOpen ? "opacity-100" : "opacity-70"
                                )}
                                aria-hidden="true"
                            />
                        </div>

                        {!isCollapsed && (
                            <>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-xs font-bold text-text-main">Ajustes</p>
                                    <p className="truncate text-[10px] text-text-sec opacity-60">Cuenta y preferencias</p>
                                </div>
                                <ChevronUp size={14} className={cn("text-text-sec transition-transform duration-200", isOpen ? "rotate-180" : "")} />
                            </>
                        )}
                    </>
                )}
            </button>
        </div>
    );
}

function MenuItem({
    icon,
    label,
    href,
    className
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-text-sec transition-all hover:bg-bg-sec hover:text-text-main",
                className
            )}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}
