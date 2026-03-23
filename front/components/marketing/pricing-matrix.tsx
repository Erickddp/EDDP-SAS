"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

interface PricingMatrixProps {
  hasSession?: boolean;
}

const tiers = [
  {
    name: "Invitado",
    price: "Gratis",
    description: "Consultas rápidas y esporádicas de marco legal.",
    features: [
      "2 consultas al día",
      "Respuestas de marco normativo",
      "Sin memoria de sesión",
      "Cero personalización de perfil",
    ],
    cta: "Ir a Chat (Gratis)",
    href: "/chat",
    featured: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "MXN / mes",
    description: "Profesionales y dueños de negocio que deciden con estrategia.",
    features: [
      "Motor de Inteligencia Completo",
      "Perfil ultra-personalizado",
      "Historial de consultas encriptado",
      "Aprendizaje adaptativo del asistente",
      "Respuestas a medida de tu expertise",
    ],
    cta: "Actualizar a Pro",
    href: "/register?plan=pro",
    featured: true,
  },
  {
    name: "Organizaciones",
    price: "Custom",
    description: "Firmas contables, despachos legales y corporativos grandes.",
    features: [
      "Uso intensivo sin límites",
      "Acceso a API dedicada",
      "Acceso Multi-usuario",
      "Soporte premium y onboarding",
    ],
    cta: "Contactar Ventas",
    href: "mailto:contacto@myfiscal.com",
    featured: false,
  },
];

export function PricingMatrix({ hasSession }: PricingMatrixProps) {
  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-bg-main" id="precios">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-cyan-main dark:to-[#8B5CF6] opacity-30 dark:opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white"
          >
            Elige el nivel de <span className="text-blue-600 dark:text-cyan-main">inteligencia</span> de tu negocio.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative rounded-3xl p-8 transition-shadow ${
                tier.featured
                  ? "bg-white dark:bg-gradient-to-b dark:from-[#121417] dark:to-bg-sec border border-blue-200 dark:border-cyan-main/50 shadow-2xl shadow-blue-500/10 dark:shadow-cyan-main/10 ring-1 ring-blue-500/20 dark:ring-cyan-main/50"
                  : "bg-white dark:bg-[#121417] border border-gray-100 dark:border-border-glow shadow-xl shadow-gray-100/50 dark:shadow-sm"
              }`}
            >
              {tier.featured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="flex items-center gap-1 bg-blue-600 dark:bg-cyan-main text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    Recomendado
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold ${tier.featured ? "text-blue-600 dark:text-cyan-main" : "text-slate-900 dark:text-white"}`}>
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 min-h-[40px]">{tier.description}</p>
              </div>

              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{tier.price}</span>
                {tier.period && <span className="text-slate-600 dark:text-gray-400 text-sm font-medium">{tier.period}</span>}
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-600 dark:text-gray-400">
                    <Check className={`w-5 h-5 shrink-0 ${tier.featured ? "text-blue-600 dark:text-cyan-main" : "text-slate-400 dark:text-gray-500"}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={hasSession && tier.featured ? "/dashboard/billing" : tier.href}
                className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                  tier.featured
                    ? "bg-blue-600 dark:bg-cyan-main hover:bg-blue-700 dark:hover:bg-cyan-main/90 text-white shadow-md hover:shadow-blue-500/30 dark:hover:shadow-cyan-main/30"
                    : "bg-slate-50 dark:bg-[#1A1D20] text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-[#252A2E] ring-1 ring-slate-200 dark:ring-0"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
