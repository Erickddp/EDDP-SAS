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
            <footer className="border-t border-border-glow bg-bg-main py-8 text-center text-sm text-text-sec z-10 relative">
                <p>© {new Date().getFullYear()} MyFiscal. Todos los derechos reservados.</p>
                <p className="mt-2 text-xs opacity-50">Demo visual - No constituye asesoría fiscal real</p>
            </footer>
        </>
    );
}
