"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/container";
import { Button } from "../ui/button";
import { useState } from "react";
import { Send } from "lucide-react";

export function Waitlist() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            setEmail("");
        }, 1500);
    };

    return (
        <section id="contacto" className="py-20 md:py-28 bg-bg-main relative">
            <Container>
                <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-cyan-main/30 bg-bg-sec/50 p-8 md:p-12 lg:p-16">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-cyan-main/10 blur-3xl rounded-full" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="mb-4 text-3xl font-extrabold text-text-main md:text-4xl">
                                ¿Quieres acceso temprano?
                            </h2>
                            <p className="mb-0 text-text-sec">
                                Únete a nuestra lista de espera para recibir novedades, actualizaciones fiscales y ser de los primeros en probar las funciones avanzadas.
                            </p>
                        </div>
                        
                        <div className="w-full max-w-md">
                            {status === 'success' ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-cyan-main/10 border border-cyan-main/30 p-6 rounded-2xl text-center"
                                >
                                    <h3 className="text-cyan-main font-bold mb-2">¡Gracias por tu interés!</h3>
                                    <p className="text-text-sec text-sm">Te hemos añadido a la lista. Pronto recibirás noticias nuestras.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        placeholder="tu@email.com"
                                        required
                                        className="flex-1 h-12 bg-bg-main border border-border-glow rounded-xl px-4 text-text-main focus:outline-none focus:border-cyan-main/50 transition-colors bg-opacity-50"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <Button 
                                        type="submit" 
                                        variant="primary" 
                                        disabled={status === 'loading'}
                                        className="h-12 px-6"
                                    >
                                        {status === 'loading' ? 'Enviando...' : (
                                            <>
                                                Unirse <Send size={16} className="ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                            <p className="mt-4 text-[10px] text-text-sec opacity-50 text-center md:text-left">
                                Al unirte, aceptas nuestra política de privacidad. No enviamos spam.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
