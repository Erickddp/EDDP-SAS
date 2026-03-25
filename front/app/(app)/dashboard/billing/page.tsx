import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/session";
import Link from "next/link";
import BillingClient from "./billing-client";

export const metadata = {
    title: "Suscripción y Pagos | MyFiscal",
    description: "Administra tu plan de MyFiscal Pro",
};

export default async function BillingPage() {
    const user = await getSession();
    const hasSession = Boolean(user);

    return (
        <div className="flex flex-col min-h-screen bg-bg-main relative mobile-layout-root z-0">
            {/* Background elements to match overall theme */}
            <div className="absolute inset-0 z-[-1] pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-bg-main to-bg-main"></div>
            
            <Header user={user} hasSession={hasSession} />
            
            <main className="flex-1 w-full pt-20">
                <BillingClient />
            </main>
            
            <footer className="border-t border-border-glow bg-bg-main py-10 text-center text-sm text-text-sec z-10 relative mt-auto">
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
        </div>
    );
}
