import { Header } from "@/components/layout/header";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Benefits } from "@/components/marketing/benefits";
import { UseCases } from "@/components/marketing/use-cases";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { LegalDisclaimer } from "@/components/marketing/legal-disclaimer";
import { FAQ } from "@/components/marketing/faq";
import { Waitlist } from "@/components/marketing/waitlist";
import { FinalCTA } from "@/components/marketing/final-cta";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function MarketingPage() {
    const user = await getSession();
    const hasSession = Boolean(user);

    return (
        <>
            <Header user={user} forceGuestView hasSession={hasSession} />
            <main className="flex-1 relative w-full">
                <Hero user={user} forceGuestView hasSession={hasSession} />
                <HowItWorks />
                <Benefits />
                <UseCases />
                <PricingPreview hasSession={hasSession} />
                <FAQ />
                <Waitlist />
                <FinalCTA hasSession={hasSession} />
                <LegalDisclaimer />
            </main>
            <footer className="border-t border-border-glow bg-bg-main py-10 text-center text-sm text-text-sec z-10 relative">
                <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-glow bg-white dark:bg-bg-sec shadow-sm overflow-hidden p-1.5">
                            <img src="/icono.png" alt="MyFiscal" className="h-full w-full object-contain" />
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
