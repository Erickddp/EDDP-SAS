"use client";

import { useState, useRef, useEffect } from "react";
import { 
    Settings, 
    LogOut, 
    User, 
    Shield, 
    FileText, 
    ChevronUp,
    Sparkles,
    CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSession } from "@/lib/session";
import Link from "next/link";

interface UserProfileMenuProps {
    user: UserSession | null;
    isCollapsed?: boolean;
}

export function UserProfileMenu({ user, isCollapsed = false }: UserProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
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

    return (
        <div className="relative w-full" ref={menuRef}>
            {/* Dropdown Menu */}
            {isOpen && (
                <div className={cn(
                    "absolute bottom-full left-0 mb-2 w-64 rounded-2xl bg-bg-card border border-border-glow shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden",
                    isCollapsed ? "left-12 bottom-0 mb-0" : ""
                )}>
                    <div className="p-3 border-b border-border-glow/50 bg-cyan-main/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl border border-cyan-main/30 bg-bg-sec overflow-hidden shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-cyan-main">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-main truncate">{user.name}</p>
                                <p className="text-[10px] text-text-sec truncate opacity-70">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-1.5">
                        <MenuItem icon={<Settings size={14} />} label="Ajustes" href="/account" />
                        {user.plan === 'gratis' && (
                             <MenuItem 
                                icon={<Sparkles size={14} className="text-cyan-main" />} 
                                label="Subir a Pro" 
                                href="/pricing" 
                                className="text-cyan-main font-bold"
                             />
                        )}
                        <div className="h-px bg-border-glow/30 my-1 mx-2" />
                        <MenuItem icon={<Shield size={14} />} label="Privacidad" href="/privacy" />
                        <MenuItem icon={<FileText size={14} />} label="Términos" href="/terms" />
                        <div className="h-px bg-border-glow/30 my-1 mx-2" />
                        <button 
                            onClick={() => window.location.href = '/api/auth/logout'}
                            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                            <LogOut size={14} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex w-full items-center gap-3 rounded-2xl p-2 transition-all group",
                    isOpen ? "bg-bg-sec/80 ring-1 ring-border-glow shadow-md" : "hover:bg-bg-sec/50",
                    isCollapsed ? "justify-center" : "px-3"
                )}
            >
                <div className={cn(
                    "h-9 w-9 rounded-xl border border-border-glow bg-white dark:bg-bg-sec overflow-hidden shrink-0 transition-transform group-hover:scale-105 shadow-sm",
                    isOpen ? "border-cyan-main/30 ring-1 ring-cyan-main/20" : ""
                )}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-cyan-main">
                            {initials}
                        </div>
                    )}
                </div>
                
                {!isCollapsed && (
                    <>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-xs font-bold text-text-main truncate">{user.name}</p>
                            <p className="text-[10px] text-text-sec truncate opacity-60">Plan {user.plan}</p>
                        </div>
                        <ChevronUp size={14} className={cn("text-text-sec transition-transform duration-200", isOpen ? "rotate-180" : "")} />
                    </>
                )}
            </button>
        </div>
    );
}

function MenuItem({ icon, label, href, className }: { icon: React.ReactNode, label: string, href: string, className?: string }) {
    return (
        <Link 
            href={href} 
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text-sec hover:text-text-main hover:bg-bg-sec transition-all",
                className
            )}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}
