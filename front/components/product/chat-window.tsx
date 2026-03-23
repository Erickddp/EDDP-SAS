"use client";

import { useState, useEffect, useRef } from "react";
import { parsePartialJson } from "ai";
import { ChatControls } from "./chat-controls";

import { PromptSuggestions } from "./prompt-suggestions";
import { MessageBubble } from "./message-bubble";
import { Send, Loader2, Info, PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMode, DetailLevel, Message, LawArticlePayload, HistoryMessage, StructuredAnswer } from "@/lib/types";
import { Storage } from "@/lib/storage";
import { ArticleViewer } from "./article-viewer";
import { USER_AVATAR_OPTIONS, resolveEffectiveAvatar } from "@/lib/avatar-options";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ProfileSettingsModal } from "./profile-settings-modal";

interface ChatWindowProps {
    conversationId: string | null;
    onUpdateMetadata: (title?: string, tags?: string[]) => void;
    onNewConversation: () => void;
    initialMode: ChatMode;
    initialDetailLevel: DetailLevel;
    onPrefsChange: (mode: ChatMode, level: DetailLevel) => void;
    onFirstMessage?: () => void;
    conversationTitle?: string;
    conversationTags?: string[];
    user?: import("@/lib/session").UserSession | null;
    onOpenSidebar?: () => void;
    isMobile?: boolean;
}

interface SessionAvatarResponse {
    avatarUrl: string;
    googleAvatarUrl: string | null;
    lockedByGoogle: boolean;
    role?: "user" | "guest" | "admin";
    questionCount?: number;
    professionalProfile?: string | null;
    isProfileComplete?: boolean;
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
    onUpdateMetadata,
    onNewConversation,
    initialMode,
    initialDetailLevel,
    onPrefsChange,
    onFirstMessage,
    conversationTitle,
    conversationTags,
    user,
    onOpenSidebar,
    isMobile,
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
        professionalProfile: null,
        isProfileComplete: false
    });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
                professionalProfile: user.professionalProfile || null,
                isProfileComplete: user.isProfileComplete || false
            });
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
                const payload = await response.json();
                const nextProfile: SessionAvatarResponse = {
                    ...payload,
                    isProfileComplete: payload.preferences?.isProfileComplete ?? false
                };
                setProfile(nextProfile);
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
                            summary: isRateLimit ? "Limite de rafaga detectado" : (isGuest ? "Has descubierto el potencial de MyFiscal!" : "Limite de Consultas Alcanzado"),
                            explanation: isRateLimit 
                                ? "Has enviado demasiadas consultas en un periodo corto. Por favor, espera un momento antes de continuar."
                                : (isGuest 
                                    ? "Como invitado, has alcanzado tu limite de consultas gratuitas. Para seguir obteniendo analisis legales de alta precision, te invitamos a unirte a nuestra comunidad."
                                    : `Has alcanzado el limite de consultas permitidas para tu plan actual.`),
                            deductiveInsight: isGuest
                                ? "Registrarte con Google es instantaneo y te permitira mantener tu historial de consultas y acceder a funciones avanzadas de analisis juridico."
                                : "Puedes actualizar tu plan en cualquier momento para obtener un limite superior y acceso a herramientas profesionales de analisis fiscal.",
                            proactiveQuestion: isGuest 
                                ? "Te gustaria continuar ahora mismo con tu cuenta de Google?" 
                                : "Deseas subir a MyFiscal Pro ahora mismo?",
                            foundation: [],
                            scenarios: isGuest 
                                ? ["Acceso ilimitado a consultas basicas", "Historial sincronizado en la nube", "Prioridad en analisis de leyes federales"]
                                : ["Consultas ilimitadas", "Exportacion de analisis", "Soporte prioritario"],
                            consequences: [],
                            certainty: "Sistema",
                            disclaimer: isGuest ? "Registrate para continuar." : "Actualiza tu plan para continuar."
                        },
                        createdAt: Date.now()
                    };
                    setMessages(prev => [...prev, limitMessage]);
                    if (isGuest) Storage.saveMessage(limitMessage);
                    return;
                }
                throw new Error(errorData.message || "Error en la respuesta del asistente");
            }

            // Call first message callback if this was a new chat
            if (messages.length === 0 && onFirstMessage) {
                onFirstMessage();
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
            let metadata: { sources?: Message["sources"]; titleSuggestion?: string; tags?: string[] } = {};

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
                                
                                // Live parsing for structured answers (Level: Tecnica)
                                let displayContent: string | StructuredAnswer = fullText;
                                if (fullText.trim().startsWith('{')) {
                                    try {
                                        const result = await parsePartialJson(fullText);
                                        if (result.value && typeof result.value === 'object') {
                                            displayContent = result.value as unknown as StructuredAnswer;
                                        }
                                    } catch {
                                        // Still a raw string while parsing fails
                                    }
                                }

                                // Update message in UI
                                setMessages(prev => prev.map(m => 
                                    m.id === assistantMessageId 
                                        ? { ...m, content: displayContent } 
                                        : m
                                ));
                            } else if (line.startsWith('d:')) { // Data chunk (metadata)
                                metadata = JSON.parse(line.substring(2));
                            }
                        } catch (error) {
                            console.warn("Error parsing stream line:", line, error);
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
            } catch {
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

            // Handle metadata updates (tags always, title only if it's the first message)
            if (metadata.tags || (metadata.titleSuggestion && messages.length === 0)) {
                onUpdateMetadata(
                    messages.length === 0 ? metadata.titleSuggestion : undefined,
                    metadata.tags
                );
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

    const handleProfileSuccess = (newData: { professionalProfile?: string | null }) => {
        setProfile(prev => ({ 
            ...prev, 
            professionalProfile: newData.professionalProfile,
            isProfileComplete: true 
        }));
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
        <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-bg-main">
            <header className="z-10 flex-none border-b border-border-glow bg-bg-sec/75 px-4 py-3 backdrop-blur-md transition-all duration-300 md:px-6 md:py-4">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            {isMobile && onOpenSidebar && (
                                <button
                                    type="button"
                                    onClick={onOpenSidebar}
                                    className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-glow bg-bg-sec text-text-sec shadow-sm transition-all hover:border-cyan-main/30 hover:text-text-main md:hidden"
                                    aria-label="Abrir historial"
                                >
                                    <PanelLeft size={18} />
                                </button>
                            )}
                            <div className="min-w-0">
                                <h1 className="truncate text-base font-bold text-text-main md:text-lg">
                                    {conversationTitle || (profile.role === "guest" ? `Invitado (${profile.questionCount}/5)` : "Nueva consulta")}
                                </h1>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {conversationTags && conversationTags.length > 0 ? (
                                        conversationTags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="rounded-md border border-cyan-main/20 bg-cyan-main/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-cyan-main">
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-sec/70">
                                            {profile.role === "guest" ? "Sesion invitado" : "Analisis fiscal"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 md:gap-3">
                            {profile.role !== "guest" && !profile.isProfileComplete && (
                                <button
                                    onClick={() => setIsProfileModalOpen(true)}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-main/30 bg-cyan-main/10 px-3 text-[11px] font-medium text-cyan-glow transition-all hover:bg-cyan-main/20"
                                >
                                    <Info size={12} />
                                    <span className="hidden sm:inline">Completar Perfil</span>
                                    <span className="sm:hidden">Perfil</span>
                                </button>
                            )}
                            <ThemeToggle compact={!!isMobile} />
                            <img
                                src={effectiveUserAvatar}
                                alt="Avatar"
                                className="h-10 w-10 rounded-full border border-border-glow object-cover shadow-lg md:h-11 md:w-11"
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main
                ref={scrollRef}
                className="relative z-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-border-glow md:px-8 md:py-8"
            >
                <div className="mx-auto max-w-4xl w-full">
                    <AnimatePresence mode="popLayout">
                        {conversationId === null || messages.length === 0 ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center justify-center pb-14 pt-6 md:pb-24 md:pt-20"
                            >
                                <div className="group relative mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[2rem] border border-border-glow bg-white p-1 shadow-[0_16px_30px_rgba(0,0,0,0.08)] ring-4 ring-cyan-main/20 dark:bg-bg-sec dark:shadow-[0_20px_40px_rgba(0,0,0,0.3)] md:mb-8 md:h-28 md:w-28 md:rounded-[2.5rem]">
                                    <div className="absolute inset-0 bg-cyan-main/10 blur-2xl group-hover:bg-cyan-main/20 transition-colors" />
                                    <img 
                                        src={effectiveUserAvatar} 
                                        alt="Avatar de perfil" 
                                        className="relative z-10 h-full w-full rounded-[1.7rem] object-cover transition-transform group-hover:scale-105 md:rounded-[2.2rem]" 
                                    />
                                </div>
                                <h2 className="mb-3 text-center text-2xl font-extrabold tracking-tight text-text-main md:text-3xl">
                                    Hola, {user?.name ? user.name.split(' ')[0] : (profile.role === 'guest' ? 'Invitado' : 'Usuario')}! En que te puedo ayudar hoy?
                                </h2>
                                <p className="mb-8 max-w-lg text-center text-sm leading-relaxed text-text-sec md:mb-10 md:text-base">
                                    {profile.professionalProfile ? (
                                        <>Como <strong className="text-cyan-main font-semibold capitalize">{profile.professionalProfile}</strong>, tus consultas fiscales se analizan con un rigor tecnico adaptado a tu experiencia. </>
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
                            <div className="pb-8 md:pb-10">
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
                                        className="mb-8 flex max-w-full gap-4 md:max-w-[85%]"
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
                                            <p className="animate-pulse pl-1 text-[10px] uppercase tracking-widest text-text-sec">Analizando legislacion...</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <div className="flex-none border-t border-border-glow/60 bg-bg-main/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl md:px-6 md:py-5">
                <div className="relative mx-auto max-w-4xl">
                    <ChatControls 
                        mode={mode} 
                        detail={detail} 
                        onModeChange={handleModeChange} 
                        onDetailChange={handleDetailChange} 
                    />
                    <div className="relative flex items-end overflow-hidden rounded-2xl border border-border-glow bg-bg-sec/92 p-1.5 shadow-xl backdrop-blur-xl transition-all focus-within:border-cyan-main/40">
                        <textarea
                            className="min-h-[52px] max-h-32 flex-1 resize-none border-0 bg-transparent py-3 pl-3 pr-14 text-[15px] text-text-main placeholder:text-text-sec focus:outline-none focus:ring-0 md:min-h-[56px]"
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
                            className="absolute bottom-3 right-3 rounded-xl bg-cyan-main text-bg-main p-2.5 transition-all hover:bg-cyan-glow hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:scale-100"
                            disabled={!inputValue.trim() || isTyping}
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    <div className="mt-3 hidden items-center justify-center gap-2 opacity-70 sm:flex">
                        <Info size={12} className="text-cyan-main" />
                        <p className="text-[9px] text-text-sec uppercase tracking-[0.1em] font-medium">
                            Demo v1: Inteligencia juridica experimental. Verifica con especialistas.
                        </p>
                    </div>
                </div>
            </div>

            <ArticleViewer
                article={selectedArticle}
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
            />

            <ProfileSettingsModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentProfessionalProfile={profile.professionalProfile}
                onSuccess={handleProfileSuccess}
            />
        </div>
    );
}

