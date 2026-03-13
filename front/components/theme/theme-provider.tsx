"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const STORAGE_KEY = "myfiscal-theme";
const DEFAULT_THEME: Theme = "dark";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
}

function getStoredTheme(): Theme {
    if (typeof window === "undefined") {
        return DEFAULT_THEME;
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getStoredTheme);

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme);
    }, [theme]);

    const setTheme = (nextTheme: Theme) => {
        setThemeState(nextTheme);
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
}

export const themeScript = `
    (function() {
        try {
            var storageKey = "${STORAGE_KEY}";
            var defaultTheme = "${DEFAULT_THEME}";
            var storedTheme = localStorage.getItem(storageKey);
            var theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : defaultTheme;
            document.documentElement.classList.toggle("dark", theme === "dark");
            document.documentElement.style.colorScheme = theme;
        } catch (error) {
            document.documentElement.classList.add("dark");
            document.documentElement.style.colorScheme = "dark";
        }
    })();
`;
