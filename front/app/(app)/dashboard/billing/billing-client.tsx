"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Zap, CheckCircle2, AlertCircle, ShieldCheck, Lock, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BillingStatus {
    plan: string;
    status: string;
    usage: {
        current: number;
        total: number;
        remaining: number;
    };
    subscriptionDetails?: {
        currentPeriodEnd: string;
    } | null;
}

export default function BillingClient() {
    const [status, setStatus] = useState<BillingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/billing/status")
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setStatus(data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleUpgrade = async () => {
        setActionLoading(true);
        setError("");
        try {
            const res = await fetch("/api/stripe/checkout", { method: "POST" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (data.url) window.location.href = data.url;
        } catch (err: any) {
            setError(err.message || "Error al iniciar el pago");
        } finally {
            setActionLoading(false);
        }
    };

    const handleManage = async () => {
        setActionLoading(true);
        setError("");
        try {
            const res = await fetch("/api/stripe/portal", { method: "POST" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (data.url) window.location.href = data.url;
        } catch (err: any) {
            setError(err.message || "Error al abrir el portal");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full border border-cyan-main max-w-[4rem] max-h-[4rem] opacity-20" />
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-main border-r-transparent shadow-[0_0_15px_rgba(0,183,255,0.5)]" />
                </div>
                <p className="text-sm font-medium uppercase tracking-widest text-cyan-main animate-pulse">
                    Accediendo a Billetera...
                </p>
            </div>
        );
    }

    const isPro = status?.plan === "pro";

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-10"
            >
                {/* Header & Copywriting ROI */}
                <motion.div variants={itemVariants} className="text-center sm:text-left mt-8 sm:mt-12 flex flex-col md:flex-row gap-8 justify-between items-start md:items-end border-b border-border-glow pb-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-main/30 bg-cyan-main/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-main mb-4">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Facturación Segura
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-main mb-4">
                            Tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-sm">Suscripción</span>
                        </h1>
                        <p className="text-base sm:text-lg text-text-sec leading-relaxed">
                            {isPro 
                                ? "Disfruta de la inteligencia fiscal avanzada de MyFiscal sin interrupciones y eleva el nivel de tu práctica."
                                : "El Nivel Pro no es un gasto, es tu brazo derecho fiscal. Convierte horas de investigación en respuestas ejecutables."}
                        </p>
                    </div>
                </motion.div>

                {error && (
                    <motion.div variants={itemVariants} className="flex items-center gap-3 rounded-xl bg-red-950/40 p-4 text-red-400 border border-red-500/30 backdrop-blur-md shadow-lg">
                        <AlertCircle className="h-5 w-5 shrink-0 animate-pulse" />
                        <p className="text-sm font-medium">{error}</p>
                    </motion.div>
                )}

                <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 items-stretch">
                    
                    {/* PLAN CARD */}
                    <motion.div variants={itemVariants} className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-border-glow to-transparent shadow-xl shadow-black/20 hover:shadow-cyan-main/10 transition-all duration-500">
                        {/* Glow effect behind */}
                        <div className={`absolute -inset-0.5 rounded-3xl opacity-20 blur-xl transition duration-500 group-hover:opacity-40 ${isPro ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-transparent'}`}></div>
                        
                        <div className="relative flex h-full flex-col justify-between rounded-3xl bg-bg-main/90 p-8 backdrop-blur-xl sm:p-10 border border-transparent z-10">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-main/10 border border-cyan-main/20 text-cyan-main shadow-inner">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-sec">Tu Plan Actual</h2>
                                        <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-sm capitalize">
                                            {status?.plan || "Gratis"}
                                        </span>
                                    </div>
                                </div>
                                
                                {isPro ? (
                                    <div className="rounded-xl bg-blue-950/20 border border-blue-500/20 p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-100">Suscripción Activa</p>
                                                {status?.subscriptionDetails?.currentPeriodEnd && (
                                                    <p className="mt-1 text-xs text-blue-300">
                                                        Próxima renovación: <span className="font-semibold">{new Date(status.subscriptionDetails.currentPeriodEnd).toLocaleDateString()}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-text-sec border-l-2 border-cyan-main pl-3 mb-6">
                                            Evita multas de actualización de leyes que no detectaste a tiempo. Por solo <strong className="text-cyan-main">$99 MXN/mes</strong> recibes:
                                        </p>
                                        <ul className="space-y-2 mb-4 text-sm text-text-sec">
                                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-main"/> Alta capacidad de análisis diario</li>
                                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-main"/> Respuestas exhaustivas y técnicas</li>
                                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-main"/> Base de conocimiento fiscal premium</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-border-glow">
                                {isPro ? (
                                    <Button 
                                        onClick={handleManage} 
                                        disabled={actionLoading}
                                        variant="outline" 
                                        className="w-full h-12 text-sm font-bold gap-2 border-border-glow shadow-sm hover:bg-bg-sec hover:text-cyan-main hover:border-cyan-main/50 transition-all rounded-xl"
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        {actionLoading ? "Cargando Portal Seguros..." : "Administrar Suscripción en Stripe"}
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleUpgrade} 
                                        disabled={actionLoading}
                                        className="relative group overflow-hidden w-full h-14 rounded-xl gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 font-extrabold text-white shadow-lg shadow-cyan-main/30 hover:shadow-cyan-main/50 transition-all"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-15deg] group-hover:animate-[shine_1.5s_ease-out]"></div>
                                        <TrendingUp className="h-5 w-5" />
                                        {actionLoading ? "Asegurando conexión..." : "Subir a Pro - $99 MXN"}
                                        {!actionLoading && <ChevronRight className="h-5 w-5 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* USAGE AND TRUST CARD */}
                    <div className="space-y-8 flex flex-col justify-between">
                        
                        {/* Usage Card */}
                        <motion.div variants={itemVariants} className="rounded-3xl border border-border-glow bg-bg-sec/40 p-6 sm:p-8 backdrop-blur-md shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-main">Métricas de Uso</h2>
                                    <p className="text-xs text-text-sec uppercase tracking-wider">Ciclo de 24 horas</p>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-end justify-between font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-black text-text-main leading-none">
                                            {status?.usage?.current || 0}
                                        </span>
                                        <span className="text-xs text-text-sec mt-1 uppercase tracking-wide">Consultas usadas</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-text-sec">
                                            / {isPro ? "Alta Capacidad" : status?.usage?.total || 3}
                                        </span>
                                    </div>
                                </div>
                                {!isPro && (
                                    <div className="relative">
                                        <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200/50 dark:bg-bg-main shadow-inner border border-black/10">
                                            <div 
                                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 object-cover shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
                                                style={{ width: `${Math.min(100, ((status?.usage?.current || 0) / (status?.usage?.total || 1)) * 100)}%`, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                            />
                                        </div>
                                        <p className="text-xs text-text-sec mt-3 font-medium flex justify-between items-center">
                                            <span>Te quedan {status?.usage?.remaining || 0} consultas gratuitas hoy.</span>
                                            {((status?.usage?.current || 0) >= (status?.usage?.total || 3)) && (
                                                <span className="text-red-400 animate-pulse">Límite alcanzado</span>
                                            )}
                                        </p>
                                    </div>
                                )}
                                {isPro && (
                                    <div className="rounded-lg bg-cyan-main/5 border border-cyan-main/10 p-4">
                                        <p className="text-sm text-cyan-main/90 font-medium">
                                            Disfrutas de una cuota de uso extendida (150/día) optimizada para despachos fiscales.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Trust Anchors Section */}
                        <motion.div variants={itemVariants} className="flex-1 rounded-3xl border border-dashed border-border-glow bg-bg-sec/10 p-6 flex flex-col justify-center items-center text-center">
                            <div className="flex justify-center gap-4 mb-4 opacity-80">
                                <Lock className="h-6 w-6 text-text-sec" />
                                <ShieldCheck className="h-6 w-6 text-text-sec" />
                            </div>
                            <h3 className="text-sm font-semibold text-text-main mb-2">Pago 100% Seguro y Encriptado</h3>
                            <p className="text-xs text-text-sec max-w-sm mb-4 leading-relaxed">
                                Utilizamos <strong>Stripe</strong> para gestionar todos los cobros. Stripe posee certificación <strong>PCI de Nivel 1</strong> (el nivel de seguridad más estricto del sector). 
                                Nosotros nunca tocamos ni almacenamos los detalles de tu tarjeta de crédito.
                            </p>
                            <div className="opacity-60 saturate-0 hover:opacity-100 hover:saturate-100 transition-all cursor-default">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Powered by Stripe" className="h-6 object-contain filter invert opacity-80 dark:opacity-100" />
                            </div>
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
