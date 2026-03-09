import { Header } from "@/components/layout/header";
import { Hero } from "@/components/marketing/hero";
import { Benefits } from "@/components/marketing/benefits";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { FinalCTA } from "@/components/marketing/final-cta";

export default function MarketingPage() {
    return (
        <>
            <Header />
            <main className="flex-1 relative w-full">
                <Hero />
                <Benefits />
                <PricingPreview />
                <FinalCTA />
            </main>
            <footer className="border-t border-border-glow bg-bg-main py-8 text-center text-sm text-text-sec z-10 relative">
                <p>© {new Date().getFullYear()} MyFiscal. Todos los derechos reservados.</p>
                <p className="mt-2 text-xs opacity-50">Demo visual - No constituye asesoría fiscal real</p>
            </footer>
        </>
    );
}
