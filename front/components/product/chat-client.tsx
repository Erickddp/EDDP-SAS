"use client";

import { Sidebar } from "@/components/product/sidebar";
import { ChatWindow } from "@/components/product/chat-window";
import { useState, useEffect } from "react";
import { Conversation, ChatMode, DetailLevel, UserPreferences } from "@/lib/types";
import { Storage } from "@/lib/storage";
import { UserSession } from "@/lib/session";

interface ChatClientProps {
    initialSession?: UserSession | null;
}

export function ChatClient({ initialSession }: ChatClientProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [prefs, setPrefs] = useState<UserPreferences>({ lastMode: "casual", lastDetailLevel: "sencilla" });

    useEffect(() => {
        const loadInitialData = async () => {
            let savedConvs: Conversation[] = [];
            
            // Try to load from DB for real users
            if (initialSession && initialSession.role !== "guest") {
                try {
                    const res = await fetch("/api/chat/history");
                    if (res.ok) {
                        const data = await res.json();
                        savedConvs = data.conversations || [];
                    }
                } catch (err) {
                    console.error("Error fetching history from DB:", err);
                    savedConvs = Storage.getConversations(); // Fallback
                }
            } else {
                // Guests use LocalStorage
                Storage.seedDemo();
                savedConvs = Storage.getConversations();
            }

            setConversations(savedConvs);

            const savedPrefs = Storage.getPreferences();
            setPrefs(savedPrefs);

            if (savedConvs.length > 0) {
                const firstActive = savedConvs.find((conversation) => !conversation.archived);
                setActiveId((firstActive ?? savedConvs[0]).id);
            }
        };

        loadInitialData();

        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (mobile) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [initialSession]);

    const handleNewConversation = () => {
        const newId = initialSession && initialSession.role !== "guest" 
            ? `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`
            : Date.now().toString();

        const newConv: Conversation = {
            id: newId,
            title: "Nueva consulta",
            mode: prefs.lastMode,
            detailLevel: prefs.lastDetailLevel,
            archived: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const newConvs = [newConv, ...conversations];
        setConversations(newConvs);
        
        if (!initialSession || initialSession.role === "guest") {
            Storage.saveConversations(newConvs);
        }
        
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
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleUpdateMetadata = (newTitle?: string, newTags?: string[]) => {
        if (!activeId) return;
        const updated = conversations.map(c =>
            c.id === activeId ? { 
                ...c, 
                title: newTitle ?? c.title, 
                tags: newTags ?? c.tags,
                updatedAt: Date.now() 
            } : c
        );
        setConversations(updated);
        Storage.saveConversations(updated);
    };

    const handlePrefsChange = (mode: ChatMode, level: DetailLevel) => {
        const newPrefs = { lastMode: mode, lastDetailLevel: level };
        setPrefs(newPrefs);
        Storage.savePreferences(newPrefs);

        if (activeId) {
            const updated = conversations.map(c =>
                c.id === activeId ? { ...c, mode, detailLevel: level, updatedAt: Date.now() } : c
            );
            setConversations(updated);
            Storage.saveConversations(updated);
        }
    };

    const handleArchiveConversation = (id: string) => {
        Storage.archiveConversation(id);
        const updatedConversations = conversations.map((conversation) =>
            conversation.id === id
                ? { ...conversation, archived: true, updatedAt: Date.now() }
                : conversation
        );
        setConversations(updatedConversations);

        if (activeId === id) {
            const nextActive = updatedConversations.find((conversation) => !conversation.archived && conversation.id !== id);
            setActiveId(nextActive?.id ?? null);
        }
    };

    const handleRestoreConversation = (id: string) => {
        Storage.restoreConversation(id);
        const updatedConversations = conversations.map((conversation) =>
            conversation.id === id
                ? { ...conversation, archived: false, updatedAt: Date.now() }
                : conversation
        );
        setConversations(updatedConversations);
        setActiveId(id);
    };

    const handleDeleteConversation = (id: string) => {
        Storage.deleteConversation(id);
        const updatedConversations = conversations.filter((conversation) => conversation.id !== id);
        setConversations(updatedConversations);

        if (activeId === id) {
            const nextActive = updatedConversations.find((conversation) => !conversation.archived) ?? updatedConversations[0];
            setActiveId(nextActive?.id ?? null);
        }
    };

    return (
        <>
            <Sidebar
                isOpen={sidebarOpen}
                isMobile={isMobile}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                conversations={conversations}
                activeId={activeId || undefined}
                onSelect={handleSelectConversation}
                onNew={handleNewConversation}
                onArchive={handleArchiveConversation}
                onRestore={handleRestoreConversation}
                onDelete={handleDeleteConversation}
                user={initialSession} // Pass user to Sidebar for profile rendering
            />

            {isMobile && sidebarOpen && (
                <button
                    type="button"
                    aria-label="Cerrar barra lateral"
                    className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex-1 min-w-0 flex flex-col relative z-10 w-full h-[100dvh]">
                <ChatWindow
                    conversationId={activeId}
                    onUpdateMetadata={handleUpdateMetadata}
                    onNewConversation={handleNewConversation}
                    initialMode={prefs.lastMode}
                    initialDetailLevel={prefs.lastDetailLevel}
                    onPrefsChange={handlePrefsChange}
                    onFirstMessage={() => setSidebarOpen(false)}
                    conversationTitle={activeId ? conversations.find(c => c.id === activeId)?.title : undefined}
                    conversationTags={activeId ? conversations.find(c => c.id === activeId)?.tags : undefined}
                    user={initialSession}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    isMobile={isMobile}
                />
            </div>
        </>
    );
}
