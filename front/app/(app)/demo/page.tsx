"use client";

import { Sidebar } from "@/components/product/sidebar";
import { ChatWindow } from "@/components/product/chat-window";
import { useState, useEffect } from "react";
import { GridBg } from "@/components/effects/grid-bg";
import { Conversation, ChatMode, DetailLevel, UserPreferences } from "@/lib/types";
import { Storage } from "@/lib/storage";

export default function DemoPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [prefs, setPrefs] = useState<UserPreferences>({ lastMode: "casual", lastDetailLevel: "sencilla" });

    // Initial load
    useEffect(() => {
        Storage.seedDemo();
        const savedConvs = Storage.getConversations();
        setConversations(savedConvs);

        const savedPrefs = Storage.getPreferences();
        setPrefs(savedPrefs);

        if (savedConvs.length > 0) {
            setActiveId(savedConvs[0].id);
        }

        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleNewConversation = () => {
        const newConv: Conversation = {
            id: Date.now().toString(),
            title: "Nueva consulta",
            mode: prefs.lastMode,
            detailLevel: prefs.lastDetailLevel,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const newConvs = [newConv, ...conversations];
        setConversations(newConvs);
        Storage.saveConversations(newConvs);
        setActiveId(newConv.id);
    };

    const handleSelectConversation = (id: string) => {
        setActiveId(id);
        const conv = conversations.find(c => c.id === id);
        if (conv) {
            const newPrefs = { lastMode: conv.mode, lastDetailLevel: conv.detailLevel };
            setPrefs(newPrefs);
            Storage.savePreferences(newPrefs);
        }
        // Auto-close sidebar on mobile after selection
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleUpdateTitle = (newTitle: string) => {
        if (!activeId) return;
        const updated = conversations.map(c =>
            c.id === activeId ? { ...c, title: newTitle, updatedAt: Date.now() } : c
        );
        setConversations(updated);
        Storage.saveConversations(updated);
    };

    const handlePrefsChange = (mode: ChatMode, level: DetailLevel) => {
        const newPrefs = { lastMode: mode, lastDetailLevel: level };
        setPrefs(newPrefs);
        Storage.savePreferences(newPrefs);

        // Also update the current active conversation persistent data if exists
        if (activeId) {
            const updated = conversations.map(c =>
                c.id === activeId ? { ...c, mode, detailLevel: level, updatedAt: Date.now() } : c
            );
            setConversations(updated);
            Storage.saveConversations(updated);
        }
    };

    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-bg-main relative mobile-layout-root">
            <GridBg className="opacity-40" />

            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                conversations={conversations}
                activeId={activeId || undefined}
                onSelect={handleSelectConversation}
                onNew={handleNewConversation}
            />

            <div className="flex-1 min-w-0 flex flex-col relative z-10 w-full h-[100dvh]">
                <ChatWindow
                    conversationId={activeId}
                    onUpdateTitle={handleUpdateTitle}
                    onNewConversation={handleNewConversation}
                    initialMode={prefs.lastMode}
                    initialDetailLevel={prefs.lastDetailLevel}
                    onPrefsChange={handlePrefsChange}
                />
            </div>

            {/* Mobile Floating Burger ONLY when sidebar is hidden */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-50 rounded-xl bg-bg-sec border border-border-glow p-3 text-text-sec shadow-2xl md:hidden active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-main">MF</span>
                    </div>
                </button>
            )}
        </div>
    );
}
