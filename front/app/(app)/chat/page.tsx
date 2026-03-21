import { GridBg } from "@/components/effects/grid-bg";
import { getSession } from "@/lib/session";
import { ChatClient } from "@/components/product/chat-client";

export default async function ChatPage() {
    const session = await getSession();

    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-bg-main relative mobile-layout-root">
            <GridBg className="opacity-40" />
            <ChatClient initialSession={session} />
        </div>
    );
}
