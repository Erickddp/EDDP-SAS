import { Conversation, Message, UserPreferences, ChatMode, DetailLevel } from "./types";

export class Storage {
    private static KEY_CONVERSATIONS = "mf_conversations";
    private static KEY_MESSAGES = "mf_messages";
    private static KEY_PREFS = "mf_prefs";

    static getConversations(): Conversation[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(this.KEY_CONVERSATIONS);
        return data ? JSON.parse(data) : [];
    }

    static saveConversations(conversations: Conversation[]) {
        if (typeof window === "undefined") return;
        localStorage.setItem(this.KEY_CONVERSATIONS, JSON.stringify(conversations));
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
