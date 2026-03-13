"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
    className?: string;
    compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const mounted = useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false
    );

    if (!mounted) {
        return (
            <div
                className={cn(
                    "h-9 rounded-xl border border-border-glow bg-bg-sec/80",
                    compact ? "w-9" : "w-[132px]",
                    className
                )}
                aria-hidden="true"
            />
        );
    }

    const isDark = theme === "dark";

    return (
        <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            className={cn(
                "border border-border-glow bg-bg-sec/80 backdrop-blur-sm",
                compact ? "w-9 px-0" : "gap-2 px-3",
                className
            )}
            aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {!compact && <span>{isDark ? "Tema claro" : "Tema oscuro"}</span>}
        </Button>
    );
}
