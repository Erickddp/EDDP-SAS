"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Zap, CheckCircle2, AlertCircle } from "lucide-react";
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

export default function BillingPage() {
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
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-main border-r-transparent" />
            </div>
        );
    }

    const isPro = status?.plan === "pro";

    return (
        <div className="container mx-auto max-w-4xl p-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Facturación y Plan</h1>
                    <p className="mt-2 text-text-sec">Administra tu suscripción y límites de uso.</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-red-500 border border-red-500/20">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Current Plan Card */}
                    <div className="flex flex-col justify-between rounded-2xl border border-border-glow bg-bg-sec/50 p-6 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-none">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-main/10 text-cyan-main">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-text-main">Plan Actual</h2>
                            </div>
                            
                            <div className="mt-4">
                                <span className="text-4xl font-extrabold text-text-main capitalize">
                                    {status?.plan || "Gratis"}
                                </span>
                                {isPro && status?.subscriptionDetails?.currentPeriodEnd && (
                                    <p className="mt-2 text-sm text-text-sec font-medium">
                                        Se renueva el: {new Date(status.subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8">
                            {isPro ? (
                                <Button 
                                    onClick={handleManage} 
                                    disabled={actionLoading}
                                    variant="outline" 
                                    className="w-full gap-2 border-border-glow shadow-sm hover:bg-bg-sec"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    {actionLoading ? "Cargando..." : "Administrar Suscripción"}
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleUpgrade} 
                                    disabled={actionLoading}
                                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-main font-bold text-white shadow-lg shadow-cyan-main/20 hover:opacity-90 transition-opacity"
                                >
                                    <Zap className="h-4 w-4" />
                                    {actionLoading ? "Cargando..." : "Actualizar a Pro ($99 MXN)"}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Usage Card */}
                    <div className="flex flex-col rounded-2xl border border-border-glow bg-bg-sec/50 p-6 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-none">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-text-main">Uso Mensual</h2>
                            </div>

                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-sec font-medium">Consultas realizadas</span>
                                    <span className="font-bold text-text-main">
                                        {status?.usage?.current || 0} / {isPro ? "Ilimitado" : status?.usage?.total || 10}
                                    </span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-bg-main shadow-inner">
                                    <div 
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-main to-purple-500 transition-all duration-500"
                                        style={{ width: isPro ? "100%" : `${Math.min(100, ((status?.usage?.current || 0) / (status?.usage?.total || 1)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-text-sec text-right font-medium">
                                    {isPro ? "Consultas Ilimitadas" : `${status?.usage?.remaining || 0} consultas restantes`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
