import { GridBg } from "@/components/effects/grid-bg";
import { ParticlesBg } from "@/components/effects/particles-bg";
import { getSession } from "@/lib/session";
import { ChatClient } from "@/components/product/chat-client";

export default async function ChatPage() {
    const session = await getSession();

    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-bg-main relative mobile-layout-root">
            <GridBg className="opacity-40" />
            <ParticlesBg
                className="absolute inset-0 opacity-55 [mask-image:radial-gradient(ellipse_72%_58%_at_50%_38%,#000_48%,transparent_100%)]"
                density={22}
                maxParticles={90}
                sizeRange={[0.6, 1.8]}
                speedRange={[0.08, 0.24]}
                opacityRange={[0.08, 0.24]}
            />
            <ChatClient initialSession={session} />
        </div>
    );
}
