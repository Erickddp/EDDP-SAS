import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function PrivacyPage() {
    const user = await getSession();
    const hasSession = Boolean(user);

    return (
        <>
            <Header user={user} forceGuestView hasSession={hasSession} />
            <main className="pt-32 pb-20">
                <Container className="max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8 text-text-main">Aviso de Privacidad</h1>
                    
                    <div className="space-y-6 text-text-sec text-lg leading-relaxed">
                        <p>Última actualización: 21 de marzo de 2026</p>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">1. Recopilación de Información</h2>
                            <p>En MyFiscal, recopilamos la siguiente información personal necesaria para la prestación de nuestros servicios:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>Nombre completo y correo electrónico (proporcionados directamente o vía Google OAuth).</li>
                                <li>Información de perfil profesional (opcional).</li>
                                <li>Historial de consultas fiscales realizadas a través de la interfaz de chat.</li>
                                <li>Información técnica de navegación (dirección IP, cookies esenciales) para rate limiting y seguridad.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">2. Uso de Google OAuth</h2>
                            <p>Al utilizar "Continuar con Google", solicitamos acceso a su nombre, dirección de correo electrónico e imagen de perfil pública. Estos datos se utilizan exclusivamente para identificar su cuenta, personalizar su experiencia y facilitar el inicio de sesión. No compartimos sus credenciales de Google con terceros.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">3. Procesamiento de IA (OpenAI / Gemini)</h2>
                            <p>Para generar estrategias y respuestas fiscales, enviamos el contenido de sus consultas a modelos de procesamiento de lenguaje natural (OpenAI GPT-4 / Gemini). No enviamos datos de identificación personal (nombres, correos) a estos modelos. Le recomendamos no incluir información sensible de clientes o números de identificación fiscal específicos en las consultas de chat.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">4. Protección de Datos</h2>
                            <p>Sus datos financieros y consultas están protegidos mediante cifrado SSL/TLS en tránsito y en reposo. Implementamos estrictos controles de acceso para garantizar que sus datos permanezcan privados y sean utilizados únicamente para mejorar la calidad de las respuestas fiscales generadas.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main mt-10 mb-4">5. Derechos del Usuario (ARCO)</h2>
                            <p>Usted tiene derecho a acceder, rectificar o eliminar su información en cualquier momento a través de la configuración de su cuenta o enviando una solicitud a soporte@myfiscal.erickddp.com.</p>
                        </section>
                    </div>
                </Container>
            </main>
            <footer className="border-t border-border-glow bg-bg-main py-8 text-center text-sm text-text-sec z-10 relative">
                <div className="flex justify-center gap-6 mb-4">
                    <Link href="/terms" className="hover:text-cyan-main transition-colors">Términos de Servicio</Link>
                    <Link href="/privacy" className="hover:text-cyan-main transition-colors text-cyan-main font-semibold">Política de Privacidad</Link>
                </div>
                <p>© {new Date().getFullYear()} MyFiscal. Todos los derechos reservados.</p>
            </footer>
        </>
    );
}
