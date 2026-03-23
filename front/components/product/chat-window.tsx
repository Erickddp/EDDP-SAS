"use client";

import { useState, useEffect, useRef } from "react";
import { ChatControls } from "./chat-controls";

import { PromptSuggestions } from "./prompt-suggestions";
import { MessageBubble } from "./message-bubble";
import { Send, Loader2, Info, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMode, DetailLevel, Message, ChatRequest, ChatResponse, LawArticlePayload, HistoryMessage, ChatUserProfile, StructuredAnswer } from "@/lib/types";
import { Storage } from "@/lib/storage";
import { ArticleViewer } from "./article-viewer";
import { USER_AVATAR_OPTIONS, resolveEffectiveAvatar } from "@/lib/avatar-options";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface ChatWindowProps {
    conversationId: string | null;
    onUpdateTitle: (title: string) => void;
    onNewConversation: () => void;
    initialMode: ChatMode;
    initialDetailLevel: DetailLevel;
    onPrefsChange: (mode: ChatMode, level: DetailLevel) => void;
    user?: import("@/lib/session").UserSession | null;
}

interface SessionAvatarResponse {
    avatarUrl: string;
    googleAvatarUrl: string | null;
    lockedByGoogle: boolean;
    role?: "user" | "guest" | "admin";
    questionCount?: number;
    professionalProfile?: string | null;
}

function getLatestExchange(messages: Message[]): Message[] {
    if (messages.length <= 2) return messages;

    const lastUserIndex = [...messages].reverse().findIndex((message) => message.role === "user");
    if (lastUserIndex === -1) {
        return messages.slice(-1);
    }

    const startIndex = messages.length - 1 - lastUserIndex;
    return messages.slice(startIndex);
}

export function ChatWindow({
    conversationId,
    onUpdateTitle,
    onNewConversation,
    initialMode,
    initialDetailLevel,
    onPrefsChange,
    user
}: ChatWindowProps) {
    const [mode, setMode] = useState<ChatMode>(initialMode);
    const [detail, setDetail] = useState<DetailLevel>(initialDetailLevel);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<LawArticlePayload | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [profile, setProfile] = useState<SessionAvatarResponse>({
        avatarUrl: USER_AVATAR_OPTIONS[0].src,
        googleAvatarUrl: null,
        lockedByGoogle: false,
        role: "guest",
        questionCount: 0,
        professionalProfile: null
    });
    const [isAvatarLockedByGoogle, setIsAvatarLockedByGoogle] = useState(false);
    const [isAvatarSaving, setIsAvatarSaving] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [tempProfessionalProfile, setTempProfessionalProfile] = useState("");
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Sync internal state with props
    useEffect(() => {
        setMode(initialMode);
        setDetail(initialDetailLevel);
    }, [initialMode, initialDetailLevel]);

    // Load messages when conversationId changes
    useEffect(() => {
        const loadMessages = async () => {
            if (!conversationId) {
                setMessages([]);
                return;
            }

            if (user && user.role !== "guest") {
                try {
                    const res = await fetch(`/api/chat/history?conversationId=${conversationId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMessages(data.messages || []);
                    }
                } catch (err) {
                    console.error("Error loading messages from DB:", err);
                    setMessages(Storage.getMessages(conversationId)); // Fallback
                }
            } else {
                setMessages(Storage.getMessages(conversationId));
            }
        };

        loadMessages();
    }, [conversationId, user]);

    useEffect(() => {
        // Hydrate from props if available
        if (user) {
            setProfile({
                avatarUrl: user.avatarUrl || USER_AVATAR_OPTIONS[0].src,
                googleAvatarUrl: user.googleAvatarUrl || null,
                lockedByGoogle: !!user.googleAvatarUrl,
                role: user.role,
                questionCount: user.questionCount || 0,
                professionalProfile: user.professionalProfile || null
            });
            setIsAvatarLockedByGoogle(!!user.googleAvatarUrl);
            return;
        }

        const localProfile = Storage.getUserProfile();
        if (localProfile?.avatarUrl) {
            setProfile((prev) => ({
                ...prev,
                avatarUrl: localProfile.avatarUrl,
                googleAvatarUrl: localProfile.googleAvatarUrl ?? prev.googleAvatarUrl ?? null
            }));
        }

        const syncAvatarProfile = async () => {
            try {
                const response = await fetch("/api/user/profile", { cache: "no-store" });
                if (!response.ok) return;
                const payload = await response.json() as SessionAvatarResponse;
                setProfile(payload);
                setIsAvatarLockedByGoogle(payload.lockedByGoogle);
                Storage.saveUserProfile({
                    avatarUrl: payload.avatarUrl,
                    googleAvatarUrl: payload.googleAvatarUrl
                });
            } catch (error) {
                console.error("No se pudo sincronizar avatar:", error);
            }
        };

        syncAvatarProfile();
    }, [user]);

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

    const sendMessage = async (text: string, isRegenerate = false) => {
        if (!text.trim() || isTyping) return;

        const targetConvId = conversationId;

        // Create conversation on the fly if none selected
        if (!targetConvId) {
            onNewConversation();
            return;
        }

        if (!isRegenerate) {
            const userMessage: Message = {
                id: Date.now().toString(),
                conversationId: targetConvId,
                role: "user",
                content: text,
                createdAt: Date.now()
            };

            setMessages(prev => [...prev, userMessage]);
            Storage.saveMessage(userMessage);
            setInputValue("");
        }
        
        setIsTyping(true);

        // Prepare history (last 6 messages)
        const history: HistoryMessage[] = messages.slice(-6).map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: typeof m.content === "string" ? m.content : m.content.summary
        }));

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: targetConvId,
                    message: text,
                    mode,
                    detailLevel: detail,
                    history
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const isLimit = response.status === 429 || 
                               response.status === 403 || 
                               errorData.code === "GUEST_LIMIT_REACHED" || 
                               errorData.code === "USAGE_LIMIT_EXCEEDED";

                if (isLimit) {
                    const isGuest = errorData.code === "GUEST_LIMIT_REACHED" || (!user);
                    const isRateLimit = response.status === 429;

                    const limitMessage: Message = {
                        id: (Date.now() + 2).toString(),
                        conversationId: targetConvId,
                        role: "assistant",
                        content: {
                            summary: isRateLimit ? "Límite de ráfaga detectado" : (isGuest ? "¡Has descubierto el potencial de MyFiscal!" : "Límite de Consultas Alcanzado"),
                            explanation: isRateLimit 
                                ? "Has enviado demasiadas consultas en un periodo corto. Por favor, espera un momento antes de continuar."
                                : (isGuest 
                                    ? "Como invitado, has alcanzado tu límite de consultas gratuitas. Para seguir obteniendo análisis legales de alta precisión, te invitamos a unirte a nuestra comunidad."
                                    : `Has alcanzado el límite de consultas permitidas para tu plan actual.`),
                            deductiveInsight: isGuest
                                ? "Registrarte con Google es instantáneo y te permitirá mantener tu historial de consultas y acceder a funciones avanzadas de análisis jurídico."
                                : "Puedes actualizar tu plan en cualquier momento para obtener un límite superior y acceso a herramientas profesionales de análisis fiscal.",
                            proactiveQuestion: isGuest 
                                ? "¿Te gustaría continuar ahora mismo con tu cuenta de Google?" 
                                : "¿Deseas subir a MyFiscal Pro ahora mismo?",
                            foundation: [],
                            scenarios: isGuest 
                                ? ["Acceso ilimitado a consultas básicas", "Historial sincronizado en la nube", "Prioridad en análisis de leyes federales"]
                                : ["Consultas ilimitadas", "Exportación de análisis", "Soporte prioritario"],
                            consequences: [],
                            certainty: "Sistema",
                            disclaimer: isGuest ? "Regístrate para continuar." : "Actualiza tu plan para continuar."
                        },
                        createdAt: Date.now()
                    };
                    setMessages(prev => [...prev, limitMessage]);
                    if (isGuest) Storage.saveMessage(limitMessage);
                    return;
                }
                throw new Error(errorData.message || "Error en la respuesta del asistente");
            }

            // Create placeholder for assistant message
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessage: Message = {
                id: assistantMessageId,
                conversationId: targetConvId,
                role: "assistant",
                content: "", // Start empty
                createdAt: Date.now()
            };

            setMessages(prev => [...prev, assistantMessage]);

            let fullText = "";
            let metadata: any = {};

            // Consume stream
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n").filter(l => l.trim());
                    
                    for (const line of lines) {
                        try {
                            if (line.startsWith('0:')) { // Text chunk
                                const textPart = JSON.parse(line.substring(2));
                                fullText += textPart;
                                
                                // Update message in UI
                                setMessages(prev => prev.map(m => 
                                    m.id === assistantMessageId 
                                        ? { ...m, content: fullText } 
                                        : m
                                ));
                            } else if (line.startsWith('d:')) { // Data chunk (metadata)
                                metadata = JSON.parse(line.substring(2));
                            }
                        } catch (e) {
                            console.warn("Error parsing stream line:", line, e);
                        }
                    }
                }
            }

            // Final message processing
            let finalContent: string | StructuredAnswer = fullText;
            try {
                // Check if fullText is a JSON string (for StructuredAnswer)
                if (fullText.trim().startsWith('{')) {
                    finalContent = JSON.parse(fullText);
                }
            } catch (e) {
                console.warn("Final text was not JSON:", fullText);
            }

            const updatedAssistantMessage: Message = {
                ...assistantMessage,
                content: finalContent,
                sources: metadata.sources
            };

            setMessages(prev => prev.map(m => 
                m.id === assistantMessageId ? updatedAssistantMessage : m
            ));

            Storage.saveMessage(updatedAssistantMessage);

            // Handle title suggestion
            if (metadata.titleSuggestion && messages.length === 0) {
                onUpdateTitle(metadata.titleSuggestion);
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

    const handleRegenerate = async () => {
        if (messages.length === 0 || isTyping) return;

        // Find the last user message
        const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
        if (lastUserIdx === -1) return;
        
        const realIdx = messages.length - 1 - lastUserIdx;
        const lastUserMsg = messages[realIdx];

        // Remove all messages after that user message (effectively deleting the failed/old assistant response)
        const newMessages = messages.slice(0, realIdx + 1);
        setMessages(newMessages);
        
        if (conversationId) {
            Storage.deleteMessagesAfter(conversationId, lastUserMsg.createdAt);
        }
        
        // Use the functional content if it's a string
        const text = typeof lastUserMsg.content === "string" ? lastUserMsg.content : "";
        if (text) {
            sendMessage(text, true);
        }
    };

    const handleOpenArticle = (article: LawArticlePayload) => {
        setSelectedArticle(article);
        setIsViewerOpen(true);
    };

    const handleAvatarChange = async (nextAvatarUrl: string) => {
        if (!nextAvatarUrl || nextAvatarUrl === profile.avatarUrl || isAvatarLockedByGoogle) return;

        const previousProfile = profile;
        const optimisticProfile: SessionAvatarResponse = {
            ...profile,
            avatarUrl: nextAvatarUrl
        };

        setProfile(optimisticProfile);
        Storage.saveUserProfile(optimisticProfile);
        setIsAvatarSaving(true);

        try {
            const response = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: nextAvatarUrl })
            });

            if (!response.ok) {
                throw new Error("No se pudo actualizar el avatar");
            }

            const payload = await response.json() as SessionAvatarResponse;
            const nextProfile: SessionAvatarResponse = {
                ...payload,
                avatarUrl: payload.avatarUrl,
                googleAvatarUrl: payload.googleAvatarUrl ?? null
            };

            setProfile(nextProfile);
            setIsAvatarLockedByGoogle(payload.lockedByGoogle);
            Storage.saveUserProfile({
                avatarUrl: nextProfile.avatarUrl,
                googleAvatarUrl: nextProfile.googleAvatarUrl
            });
        } catch (error) {
            console.error(error);
            setProfile(previousProfile);
            Storage.saveUserProfile({
                avatarUrl: previousProfile.avatarUrl,
                googleAvatarUrl: previousProfile.googleAvatarUrl
            });
        } finally {
            setIsAvatarSaving(false);
        }
    };

    const handleUpdateProfile = async () => {
        setIsProfileSaving(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ professionalProfile: tempProfessionalProfile })
            });

            if (!response.ok) throw new Error("Error al actualizar perfil");

            setProfile(prev => ({ ...prev, professionalProfile: tempProfessionalProfile }));
            setIsProfileModalOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handleAction = async (actionType: string) => {
        if (actionType === "upgrade_pro") {
            try {
                const res = await fetch("/api/billing/create-checkout", { method: "POST" });
                if (res.ok) {
                    const { url } = await res.json();
                    window.location.href = url;
                } else {
                    console.error("Failed to create checkout session");
                }
            } catch (err) {
                console.error("Error creating checkout session:", err);
            }
        }
    };

    const effectiveUserAvatar = resolveEffectiveAvatar({
        avatarUrl: profile.avatarUrl,
        googleAvatarUrl: profile.googleAvatarUrl,
        seed: conversationId ?? "chat-user"
    });
    const visibleMessages = getLatestExchange(messages);
    const hiddenCount = Math.max(messages.length - visibleMessages.length, 0);

    return (
        <div className="flex h-[100dvh] flex-col bg-bg-main relative w-full overflow-hidden pt-16 md:pt-0">
            <header className="flex-none border-b border-border-glow bg-bg-sec/50 p-4 backdrop-blur-md z-10 w-full transition-all duration-300">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-bg-sec border border-border-glow shadow-sm p-2 overflow-hidden">
                            <img src="/icono.png" alt="MyFiscal" className="w-full h-full object-contain dark:hidden" />
                            <img src="/icono2.png" alt="MyFiscal" className="w-full h-full object-contain hidden dark:block" />
                        </div>
                        <div>
                             <h1 className="text-sm font-bold text-text-main">
                                {profile.role === 'guest' ? `Invitado (${profile.questionCount}/5)` : (user?.name || 'Consulta Fiscal')}
                            </h1>
                            <p className="text-[10px] text-text-sec uppercase tracking-widest opacity-60">
                                {profile.role === 'guest' ? 'Límite de Prueba (5 cons.)' : (profile.professionalProfile ? 'Análisis Especializado' : 'Motor de análisis v1.0')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {profile.role !== 'guest' && !profile.professionalProfile && (
                             <button 
                                onClick={() => {
                                    setTempProfessionalProfile("");
                                    setIsProfileModalOpen(true);
                                }}
                                className="flex items-center gap-2 rounded-lg bg-cyan-main/10 border border-cyan-main/30 px-3 py-1.5 text-[11px] font-medium text-cyan-glow hover:bg-cyan-main/20 transition-all"
                             >
                                <Info size={12} />
                                Completar Perfil
                             </button>
                        )}
                        <ThemeToggle />
                        <div className="flex items-center gap-2 rounded-xl border border-border-glow bg-bg-sec/80 px-2 py-1">
                            <img
                                src={effectiveUserAvatar}
                                alt="Avatar de usuario"
                                className="h-6 w-6 rounded-full border border-border-glow object-cover"
                            />
                            {isAvatarLockedByGoogle ? (
                                <span className="text-[11px] text-text-sec">Avatar Google</span>
                            ) : (
                                <label className="flex items-center gap-1">
                                    <UserCircle2 size={14} className="text-text-sec" />
                                    <select
                                        value={USER_AVATAR_OPTIONS.some((option) => option.src === profile.avatarUrl) ? profile.avatarUrl : USER_AVATAR_OPTIONS[0].src}
                                        onChange={(event) => handleAvatarChange(event.target.value)}
                                        disabled={isAvatarSaving}
                                        className="bg-transparent text-[11px] text-text-main outline-none"
                                        aria-label="Seleccionar avatar de perfil"
                                    >
                                        {USER_AVATAR_OPTIONS.map((option) => (
                                            <option key={option.id} value={option.src} className="bg-bg-main text-text-main">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </div>
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
                                className="flex flex-col items-center justify-center pt-10 md:pt-20 pb-24"
                            >
                                <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-white dark:bg-bg-sec border border-border-glow shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group p-1 ring-4 ring-cyan-main/20">
                                    <div className="absolute inset-0 bg-cyan-main/10 blur-2xl group-hover:bg-cyan-main/20 transition-colors" />
                                    <img 
                                        src={effectiveUserAvatar} 
                                        alt="Avatar de perfil" 
                                        className="w-full h-full object-cover rounded-[2.2rem] relative z-10 transition-transform group-hover:scale-105" 
                                    />
                                </div>
                                <h2 className="mb-3 text-3xl font-extrabold text-text-main text-center tracking-tight">
                                    ¡Hola, {user?.name ? user.name.split(' ')[0] : (profile.role === 'guest' ? 'Invitado' : 'Usuario')}! ¿En qué te puedo ayudar hoy?
                                </h2>
                                <p className="text-text-sec text-base text-center mb-10 max-w-lg leading-relaxed">
                                    {profile.professionalProfile ? (
                                        <>Como <strong className="text-cyan-main font-semibold capitalize">{profile.professionalProfile}</strong>, tus consultas fiscales se analizan con un rigor técnico adaptado a tu experiencia. </>
                                    ) : (
                                        <>Completa tu perfil profesional para recibir respuestas fiscales adaptadas a tu nivel de experiencia. </>
                                    )}
                                    Haz una consulta sobre IVA, RESICO, declaraciones o multas.
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
                                {hiddenCount > 0 && (
                                    <div className="mb-4 rounded-xl border border-border-glow bg-bg-sec/70 px-4 py-2 text-xs text-text-sec">
                                        Historial preservado internamente ({hiddenCount} mensaje(s) ocultos). Mostrando solo el intercambio mas reciente.
                                    </div>
                                )}

                                {visibleMessages.map((m) => (
                                    <MessageBubble
                                        key={m.id}
                                        role={m.role}
                                        content={m.content}
                                        sources={m.sources}
                                        onOpenArticle={handleOpenArticle}
                                        onRegenerate={handleRegenerate}
                                        onAction={handleAction}
                                        userAvatarUrl={effectiveUserAvatar}
                                        assistantAvatarUrl="/icono.png"
                                    />
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-4 max-w-[85%] mb-8"
                                    >
                                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-glow bg-bg-sec">
                                            <img
                                                src="/icono.png"
                                                alt="Avatar MyFiscal"
                                                className="absolute inset-0 h-full w-full object-cover dark:hidden"
                                            />
                                            <img
                                                src="/icono2.png"
                                                alt="Avatar MyFiscal"
                                                className="absolute inset-0 h-full w-full object-cover hidden dark:block"
                                            />
                                            <Loader2 size={16} className="animate-spin text-cyan-main" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="bg-bg-sec/40 border border-border-glow rounded-2xl rounded-tl-sm px-5 py-4 backdrop-blur-sm">
                                                <div className="flex gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-main animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-main animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-main animate-bounce" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-text-sec uppercase tracking-widest pl-1 animate-pulse">Analizando legislación...</p>
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
                    <ChatControls 
                        mode={mode} 
                        detail={detail} 
                        onModeChange={handleModeChange} 
                        onDetailChange={handleDetailChange} 
                    />
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

            <ArticleViewer
                article={selectedArticle}
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
            />

            <AnimatePresence>
                {isProfileModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-md rounded-2xl border border-border-glow bg-bg-sec p-6 shadow-2xl"
                        >
                            <h3 className="mb-2 text-xl font-bold text-text-main">Personaliza tu experiencia</h3>
                            <p className="mb-6 text-sm text-text-sec">
                                Dinos cuál es tu perfil profesional. Esto ayudará a que MyFiscal adapte sus análisis deductivos a tu nivel de experiencia.
                            </p>
                            
                            <div className="mb-6 flex flex-wrap gap-2">
                                {["Contador", "Abogado", "Empresario", "Estudiante", "Otro"].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setTempProfessionalProfile(p)}
                                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                                            tempProfessionalProfile === p 
                                            ? "bg-cyan-main text-bg-main" 
                                            : "bg-bg-main border border-border-glow text-text-sec hover:border-cyan-main/50"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="flex-1 rounded-xl border border-border-glow bg-bg-main py-2.5 text-sm font-medium text-text-sec hover:bg-bg-sec transition-all"
                                >
                                    Omitir
                                </button>
                                <button 
                                    onClick={handleUpdateProfile}
                                    disabled={!tempProfessionalProfile || isProfileSaving}
                                    className="flex-1 rounded-xl bg-cyan-main py-2.5 text-sm font-medium text-bg-main hover:bg-cyan-glow transition-all disabled:opacity-50"
                                >
                                    {isProfileSaving ? "Guardando..." : "Confirmar"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
