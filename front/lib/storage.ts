import { Conversation, Message, UserPreferences, ChatUserProfile } from "./types";

export class Storage {
    private static KEY_CONVERSATIONS = "mf_conversations";
    private static KEY_MESSAGES = "mf_messages";
    private static KEY_PREFS = "mf_prefs";
    private static KEY_PROFILE = "mf_user_profile";

    static getConversations(): Conversation[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(this.KEY_CONVERSATIONS);
        return data ? JSON.parse(data) : [];
    }

    static saveConversations(conversations: Conversation[]) {
        if (typeof window === "undefined") return;
        localStorage.setItem(this.KEY_CONVERSATIONS, JSON.stringify(conversations));
    }

    static archiveConversation(conversationId: string) {
        if (typeof window === "undefined") return;
        const conversations = this.getConversations();
        const updated = conversations.map((conversation) =>
            conversation.id === conversationId
                ? { ...conversation, archived: true, updatedAt: Date.now() }
                : conversation
        );
        this.saveConversations(updated);
    }

    static restoreConversation(conversationId: string) {
        if (typeof window === "undefined") return;
        const conversations = this.getConversations();
        const updated = conversations.map((conversation) =>
            conversation.id === conversationId
                ? { ...conversation, archived: false, updatedAt: Date.now() }
                : conversation
        );
        this.saveConversations(updated);
    }

    static deleteConversation(conversationId: string) {
        if (typeof window === "undefined") return;
        const conversations = this.getConversations();
        const remainingConversations = conversations.filter((conversation) => conversation.id !== conversationId);
        this.saveConversations(remainingConversations);

        const data = localStorage.getItem(this.KEY_MESSAGES);
        const allMessages: Message[] = data ? JSON.parse(data) : [];
        const remainingMessages = allMessages.filter((message) => message.conversationId !== conversationId);
        localStorage.setItem(this.KEY_MESSAGES, JSON.stringify(remainingMessages));
    }

    static getMessages(conversationId: string): Message[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(this.KEY_MESSAGES);
        const allMessages: Message[] = data ? JSON.parse(data) : [];
        return allMessages.filter(m => m.conversationId === conversationId);
    }

    static saveMessage(message: Message) {
        if (typeof window === "undefined") return;
        const data = localStorage.getItem(this.KEY_MESSAGES);
        const allMessages: Message[] = data ? JSON.parse(data) : [];
        allMessages.push(message);
        localStorage.setItem(this.KEY_MESSAGES, JSON.stringify(allMessages));
    }

    static deleteMessagesAfter(conversationId: string, timestamp: number) {
        if (typeof window === "undefined") return;
        const data = localStorage.getItem(this.KEY_MESSAGES);
        const allMessages: Message[] = data ? JSON.parse(data) : [];
        const filtered = allMessages.filter(m => m.conversationId !== conversationId || m.createdAt <= timestamp);
        localStorage.setItem(this.KEY_MESSAGES, JSON.stringify(filtered));
    }

    static getPreferences(): UserPreferences {
        if (typeof window === "undefined") return { lastMode: "casual", lastDetailLevel: "sencilla" };
        const data = localStorage.getItem(this.KEY_PREFS);
        return data ? JSON.parse(data) : { lastMode: "casual", lastDetailLevel: "sencilla" };
    }

    static savePreferences(prefs: UserPreferences) {
        if (typeof window === "undefined") return;
        localStorage.setItem(this.KEY_PREFS, JSON.stringify(prefs));
    }

    static clearAll() {
        if (typeof window === "undefined") return;
        localStorage.removeItem(this.KEY_CONVERSATIONS);
        localStorage.removeItem(this.KEY_MESSAGES);
        localStorage.removeItem(this.KEY_PREFS);
        localStorage.removeItem(this.KEY_PROFILE);
    }

    static getUserProfile(): ChatUserProfile | null {
        if (typeof window === "undefined") return null;
        const data = localStorage.getItem(this.KEY_PROFILE);
        return data ? JSON.parse(data) : null;
    }

    static saveUserProfile(profile: ChatUserProfile) {
        if (typeof window === "undefined") return;
        localStorage.setItem(this.KEY_PROFILE, JSON.stringify(profile));
    }

    // Create initial session storage seeding (optional for first usage)
    static seedDemo() {
        if (this.getConversations().length > 0) return;

        const demoConv: Conversation = {
            id: "demo-1",
            title: "IVA en honorarios",
            mode: "profesional",
            detailLevel: "detallada",
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const demoMsg: Message = {
            id: "msg-1",
            conversationId: "demo-1",
            role: "assistant",
            content: {
                summary: "Bienvenido a la demo de MyFiscal. Haz tu primera consulta técnica sobre facturación o RESICO.",
                foundation: ["Referencia inicial demo."],
                scenarios: ["Inicio de sesión de ejemplo."],
                consequences: ["N/A"],
                certainty: "Alta",
                disclaimer: "Este es un mensaje de bienvenida demo."
            },
            createdAt: Date.now()
        };

        this.saveConversations([demoConv]);
        this.saveMessage(demoMsg);
    }
}
