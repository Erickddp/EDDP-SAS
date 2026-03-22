import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function TermsPage() {
    const user = await getSession();
    const hasSession = Boolean(user);

    return (
        <>
            <Header user={user} forceGuestView hasSession={hasSession} />
            <main className="pt-32 pb-20">
                <Container className="max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8 text-text-main">Términos y Condiciones de Servicio</h1>
                    
                    <div className="space-y-6 text-text-sec text-lg leading-relaxed">
                        <p>Última actualización: 21 de marzo de 2026</p>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">1. Descripción del Servicio</h2>
                            <p>MyFiscal (SASFiscal) es una plataforma de inteligencia artificial diseñada para proporcionar asistencia e investigación basada en leyes y fundamentos fiscales mexicanos vigentes. El servicio genera estrategias y datos informativos para usuarios contadores y contribuyentes.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">2. Limitación de Responsabilidad (Exención Legal)</h2>
                            <p className="bg-bg-sec p-6 border-l-4 border-cyan-main font-medium italic">EL CONTENIDO GENERADO POR MYFISCAL NO CONSTITUYE ASESORÍA FISCAL, LEGAL O CONTABLE PROFESIONAL. MyFiscal es una herramienta de asistencia tecnológica. Los resultados generados deben ser siempre validados por un profesional fiscal colegiado antes de ser utilizados para la toma de decisiones legales o contables.</p>
                            <p className="mt-4">MyFiscal no se hace responsable por errores en la interpretación de las leyes o por inconsistencias en los datos proporcionados por los modelos de lenguaje de terceros (OpenAI/Gemini).</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">3. Suscripciones y Pagos (Stripe)</h2>
                            <p>Los pagos y suscripciones de nivel Pro son gestionados de forma segura a través de Stripe. Al suscribirse, usted acepta los términos de facturación recurrentes de Stripe. La cancelación de la suscripción desactivará las funciones Pro al final del ciclo de facturación actual.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">4. Uso Aceptable</h2>
                            <p>Está estrictamente prohibido:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>Intentar realizar scraping o extracción masiva de la base de datos legal de MyFiscal.</li>
                                <li>Utilizar la plataforma para evadir de forma ilegal obligaciones fiscales.</li>
                                <li>Compartir cuentas de nivel Pro entre múltiples usuarios no autorizados.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">5. Modificaciones</h2>
                            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la plataforma tras cambios en los términos constituirá la aceptación de los mismos.</p>
                        </section>
                    </div>
                </Container>
            </main>
            <footer className="border-t border-border-glow bg-bg-main py-8 text-center text-sm text-text-sec z-10 relative">
                <div className="flex justify-center gap-6 mb-4">
                    <Link href="/terms" className="hover:text-cyan-main transition-colors text-cyan-main font-semibold">Términos de Servicio</Link>
                    <Link href="/privacy" className="hover:text-cyan-main transition-colors">Política de Privacidad</Link>
                </div>
                <p>© {new Date().getFullYear()} MyFiscal. Todos los derechos reservados.</p>
            </footer>
        </>
    );
}
