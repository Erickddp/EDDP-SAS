import { Header } from "@/components/layout/header";
import { HeroArea } from "@/components/marketing/hero-area";
import { ValueStorytelling } from "@/components/marketing/value-storytelling";
import { PricingMatrix } from "@/components/marketing/pricing-matrix";
import { TrustSection } from "@/components/marketing/trust-section";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function MarketingPage() {
    const user = await getSession();
    const hasSession = Boolean(user);

    return (
        <>
            <Header user={user} forceGuestView hasSession={hasSession} />
            <main className="flex-1 relative w-full">
                <HeroArea hasSession={hasSession} />
                <ValueStorytelling />
                <PricingMatrix hasSession={hasSession} />
                <TrustSection />
            </main>
            <footer className="border-t border-border-glow bg-bg-main py-10 text-center text-sm text-text-sec z-10 relative">
                <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-glow bg-white dark:bg-bg-sec shadow-sm overflow-hidden p-1.5">
                            <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain dark:hidden" />
                            <img src="/icono2.png" alt="MyFiscal" className="h-full w-full object-contain hidden dark:block" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-text-main">
                            MyFiscal
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-8 font-medium">
                        <Link href="/#como-funciona" className="hover:text-cyan-main transition-colors">Cómo funciona</Link>
                        <Link href="/#precios" className="hover:text-cyan-main transition-colors">Precios</Link>
                        <Link href="/terms" className="hover:text-cyan-main transition-colors underline decoration-cyan-main/20">Términos</Link>
                        <Link href="/privacy" className="hover:text-cyan-main transition-colors underline decoration-cyan-main/20">Privacidad</Link>
                    </div>

                    <div className="text-xs space-y-1 text-text-sec/60">
                        <p>© {new Date().getFullYear()} MyFiscal. Todos los derechos reservados.</p>
                        <p>Asistente de consulta, no constituye asesoría fiscal real.</p>
                    </div>
                </div>
            </footer>
        </>
    );
}
