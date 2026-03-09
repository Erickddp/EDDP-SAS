"use client";

import { useState, useEffect, useRef } from "react";
import { ModeToggle } from "./mode-toggle";
import { DetailToggle } from "./detail-toggle";
import { PromptSuggestions } from "./prompt-suggestions";
import { MessageBubble } from "./message-bubble";
import { Send, Sparkles, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMode, DetailLevel, Message, ChatRequest, ChatResponse, Conversation } from "@/lib/types";
import { Storage } from "@/lib/storage";

interface ChatWindowProps {
    conversationId: string | null;
    onUpdateTitle: (title: string) => void;
    onNewConversation: () => void;
    initialMode: ChatMode;
    initialDetailLevel: DetailLevel;
    onPrefsChange: (mode: ChatMode, level: DetailLevel) => void;
}

export function ChatWindow({
    conversationId,
    onUpdateTitle,
    onNewConversation,
    initialMode,
    initialDetailLevel,
    onPrefsChange
}: ChatWindowProps) {
    const [mode, setMode] = useState<ChatMode>(initialMode);
    const [detail, setDetail] = useState<DetailLevel>(initialDetailLevel);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Sync internal state with props
    useEffect(() => {
        setMode(initialMode);
        setDetail(initialDetailLevel);
    }, [initialMode, initialDetailLevel]);

    // Load messages when conversationId changes
    useEffect(() => {
        if (conversationId) {
            setMessages(Storage.getMessages(conversationId));
        } else {
            setMessages([]);
        }
    }, [conversationId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleModeChange = (newMode: ChatMode) => {
        setMode(newMode);
        onPrefsChange(newMode, detail);
    };

    const handleDetailChange = (newLevel: DetailLevel) => {
        setDetail(newLevel);
        onPrefsChange(mode, newLevel);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isTyping) return;

        let targetConvId = conversationId;

        // Create conversation on the fly if none selected
        if (!targetConvId) {
            // Note: In a real app we'd call the parent to create it first. 
            // Simplified: the parent handles the empty state anyway.
            onNewConversation();
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            conversationId: targetConvId,
            role: "user",
            content: text,
            createdAt: Date.now()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        Storage.saveMessage(userMessage);
        setInputValue("");
        setIsTyping(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: targetConvId,
                    message: text,
                    mode,
                    detailLevel: detail
                } as ChatRequest)
            });

            if (!response.ok) throw new Error("Error en la respuesta del asistente");

            const data: ChatResponse = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                conversationId: targetConvId,
                role: "assistant",
                content: data.answer,
                sources: data.sources,
                createdAt: Date.now()
            };

            setMessages(prev => [...prev, assistantMessage]);
            Storage.saveMessage(assistantMessage);

            // Handle title suggestion for new conversations
            if (data.titleSuggestion && messages.length === 0) {
                onUpdateTitle(data.titleSuggestion);
            }

        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                conversationId: targetConvId,
                role: "system",
                content: "Lo siento, hubo un error procesando tu consulta fiscal. Por favor intenta de nuevo.",
                createdAt: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-[100dvh] flex-col bg-bg-main relative w-full overflow-hidden pt-16 md:pt-0">
            <header className="flex-none border-b border-border-glow bg-bg-sec/50 p-4 backdrop-blur-md z-10 w-full transition-all duration-300">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-main/10 text-cyan-main">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-text-main">Consulta Fiscal MyFiscal</h1>
                            <p className="text-[10px] text-text-sec uppercase tracking-widest opacity-60">Motor de análisis v1.0</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <ModeToggle mode={mode} onChange={handleModeChange} />
                        <div className="h-6 w-px bg-border-glow hidden sm:block" />
                        <DetailToggle level={detail} onChange={handleDetailChange} />
                    </div>
                </div>
            </header>

            <main
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-border-glow z-0 w-full relative"
            >
                <div className="mx-auto max-w-4xl w-full">
                    <AnimatePresence mode="popLayout">
                        {conversationId === null || messages.length === 0 ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center justify-center py-12 md:py-24"
                            >
                                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-main/10 border border-cyan-main/20 shadow-[0_0_40px_rgba(32,196,255,0.1)] relative">
                                    <div className="absolute inset-0 bg-cyan-main/5 blur-xl animate-pulse rounded-full" />
                                    <span className="text-3xl font-black text-cyan-glow relative z-10">MF</span>
                                </div>
                                <h2 className="mb-3 text-2xl font-bold text-text-main text-center">¿Cómo puedo orientarte hoy?</h2>
                                <p className="text-text-sec text-sm text-center mb-10 max-w-md leading-relaxed">
                                    Haz una consulta sobre IVA, RESICO, declaraciones o multas. Esta demo te mostrará el rigor analítico de MyFiscal.
                                </p>
                                <PromptSuggestions onSelect={(p) => {
                                    if (!conversationId) onNewConversation();
                                    // We need the ID to be present before sending, so we use a small timeout inside the parent logic OR 
                                    // we just set the input and let the user click send. Let's auto-send for better UX.
                                    setInputValue(p);
                                    if (conversationId) sendMessage(p);
                                }} />
                            </motion.div>
                        ) : (
                            <div className="pb-32">
                                {messages.map((m) => (
                                    <MessageBubble
                                        key={m.id}
                                        role={m.role}
                                        content={m.content}
                                        sources={m.sources}
                                    />
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-4 max-w-[85%] mb-8"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-main/30 bg-cyan-main/10 text-cyan-glow">
                                            <Loader2 size={18} className="animate-spin" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="bg-bg-sec/40 border border-border-glow rounded-2xl rounded-tl-sm px-5 py-4 backdrop-blur-sm">
                                                <div className="flex gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-main animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-main animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-main animate-bounce" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-text-sec uppercase tracking-widest pl-1 animate-pulse">Analizando fundamentación...</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <div className="flex-none p-4 md:p-6 bg-gradient-to-t from-bg-main via-bg-main to-transparent absolute bottom-0 w-full z-10">
                <div className="mx-auto max-w-4xl relative">
                    <div className="relative flex items-end overflow-hidden rounded-2xl border border-border-glow bg-bg-sec/90 shadow-2xl backdrop-blur-xl focus-within:border-cyan-main/40 transition-all p-1.5">
                        <textarea
                            className="flex-1 resize-none border-0 bg-transparent py-3 pl-3 pr-14 text-[15px] text-text-main placeholder:text-text-sec focus:outline-none focus:ring-0 min-h-[52px] max-h-32"
                            placeholder={conversationId ? "Escribe tu duda fiscal..." : "Empieza una nueva consulta..."}
                            rows={1}
                            value={inputValue}
                            disabled={isTyping}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(inputValue);
                                }
                            }}
                        />
                        <button
                            onClick={() => sendMessage(inputValue)}
                            className="absolute right-3 bottom-3 rounded-xl bg-cyan-main text-bg-main p-2.5 transition-all hover:bg-cyan-glow hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:scale-100"
                            disabled={!inputValue.trim() || isTyping}
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-4 opacity-70">
                        <Info size={12} className="text-cyan-main" />
                        <p className="text-[9px] text-text-sec uppercase tracking-[0.1em] font-medium">
                            Demo v1: Inteligencia jurídica experimental. Verifica con especialistas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
