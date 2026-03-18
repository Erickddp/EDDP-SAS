"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Zap, CreditCard, Activity, Calendar } from "lucide-react";

interface BillingStatus {
    plan: string;
    status: string;
    usage: {
        current: number;
        total: number;
        remaining: number;
    };
    subscriptionDetails: {
        id: string;
        currentPeriodEnd: string;
        provider: string;
    } | null;
}

export default function AccountPage() {
    const [status, setStatus] = useState<BillingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await fetch("/api/billing/status");
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                const data = await res.json();
                setStatus(data);
                console.log("[Account] Billing status loaded:", data);
            } catch (error) {
                console.error("[Account] Failed to fetch billing status:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, [router]);

    const handleUpgrade = async () => {
        setCheckoutLoading(true);
        console.log("[Account] Initiating checkout for PRO plan");
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "pro" }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("[Account] Checkout failed:", error);
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-main flex items-center justify-center">
                <div className="animate-pulse text-cyan-main">Cargando tu cuenta...</div>
            </div>
        );
    }

    const isPro = status?.plan === "pro";
    const isActive = status?.status === "active" || status?.status === "trialing";
    const usagePercent = status ? (status.usage.current / status.usage.total) * 100 : 0;

    return (
        <div className="min-h-screen bg-bg-main overflow-x-hidden">
            <Header />
            <main className="pt-32 pb-20">
                <Container>
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-text-main mb-2">Mi Cuenta</h1>
                            <p className="text-text-sec text-lg">Gestiona tu suscripción y revisa tu consumo actual.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Plan Card */}
                            <div className="md:col-span-2 rounded-2xl border border-border-glow bg-bg-sec/50 p-8 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-cyan-main/10 text-cyan-main">
                                                <Zap size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-sec uppercase tracking-wider">Plan Actual</p>
                                                <h2 className="text-2xl font-bold text-text-main">{status?.plan.toUpperCase() || "GRATIS"}</h2>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {status?.status || "Inactivo"}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-sec">Consumo mensual</span>
                                            <span className="text-text-main font-medium">{status?.usage.current} / {status?.usage.total} consultas</span>
                                        </div>
                                        <div className="h-2 w-full bg-bg-main rounded-full overflow-hidden border border-border-glow">
                                            <div 
                                                className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-cyan-main'}`}
                                                style={{ width: `${Math.min(100, usagePercent)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-text-sec">
                                            Te quedan <span className="text-cyan-main font-bold">{status?.usage.remaining}</span> consultas este mes.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-border-glow flex flex-col sm:flex-row gap-4">
                                    {!isPro ? (
                                        <Button onClick={handleUpgrade} disabled={checkoutLoading} className="flex-1 gap-2">
                                            <Zap size={18} />
                                            {checkoutLoading ? "Procesando..." : "Subir a PRO"}
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="flex-1 gap-2" onClick={() => console.log("Manage subscription click")}>
                                            <CreditCard size={18} />
                                            Gestionar Pago
                                        </Button>
                                    )}
                                    <Button variant="ghost" onClick={() => router.push("/chat")}>
                                        Volver al Chat
                                    </Button>
                                </div>
                            </div>

                            {/* Details Sidebar */}
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-border-glow bg-bg-sec/50 p-6 shadow-lg backdrop-blur-xl">
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Calendar size={16} className="text-cyan-main" />
                                        Siguiente Pago
                                    </h3>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-text-main">
                                            {status?.subscriptionDetails?.currentPeriodEnd 
                                                ? new Date(status.subscriptionDetails.currentPeriodEnd).toLocaleDateString()
                                                : "No disponible"}
                                        </p>
                                        <p className="text-xs text-text-sec">Tu plan se reinicia el primer día del mes.</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border-glow bg-bg-sec/50 p-6 shadow-lg backdrop-blur-xl">
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={16} className="text-cyan-main" />
                                        Estado de Red
                                    </h3>
                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                        <CheckCircle2 size={14} />
                                        <span>Conectado a Supabase</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                                        <CheckCircle2 size={14} />
                                        <span>Sincronización Activa</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        {!isPro && (
                            <div className="rounded-2xl bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 p-8 flex flex-col md:flex-row items-center gap-6">
                                <div className="h-16 w-16 flex-shrink-0 rounded-full bg-cyan-main/20 flex items-center justify-center text-cyan-main">
                                    <Zap size={32} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-text-main mb-1">¿Necesitas más consultas?</h3>
                                    <p className="text-text-sec">El plan PRO te ofrece hasta 500 consultas mensuales y acceso a herramientas avanzadas de análisis fiscal.</p>
                                </div>
                                <Button size="lg" onClick={handleUpgrade} disabled={checkoutLoading}>
                                    Actualizar Ahora
                                </Button>
                            </div>
                        )}
                    </div>
                </Container>
            </main>
        </div>
    );
}
