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
      "3 consultas rápidas al día",
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
      "Consultas de Alta Capacidad",
      "Memoria de Acero (Contexto Persistente)",
      "Análisis Normativo Profundo",
      "Aprendizaje adaptativo",
    ],
    cta: "Actualizar a Pro",
    href: "/register?plan=pro",
    featured: true,
  },
  {
    name: "Organizaciones",
    price: "A la medida",
    description: "Firmas contables, despachos y equipos.",
    features: [
      "Límites ajustados por volumen",
      "Roles multi-usuario",
      "Entrenamiento sobre datos privados del despacho",
    ],
    cta: "Contactar a Ventas",
    href: "mailto:contacto@erickddp.com",
    featured: false,
  },
];

export function PricingMatrix({ hasSession }: PricingMatrixProps) {
  return (
    <section className="py-24 relative overflow-hidden" id="precios">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-text-main"
          >
            Elige el nivel de <span className="text-blue-600 dark:text-cyan-main">inteligencia</span>
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
              className={`relative rounded-3xl p-8 transition-all backdrop-blur-md ${
                tier.featured
                  ? "bg-white/20 dark:bg-white/10 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 dark:border-cyan-main dark:shadow-cyan-main/10"
                  : "bg-white/10 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 shadow-xl shadow-slate-200/20 dark:shadow-none"
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
                <h3 className={`text-xl font-bold text-text-main`}>
                  {tier.name}
                </h3>
                <p className="text-sm text-text-sec mt-2 min-h-[40px] font-medium">{tier.description}</p>
              </div>

              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-text-main">{tier.price}</span>
                {tier.period && <span className="text-text-sec text-sm font-medium">{tier.period}</span>}
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-text-sec font-medium">
                    <Check className={`w-5 h-5 shrink-0 ${tier.featured ? "text-blue-600 dark:text-cyan-main" : "text-blue-400 dark:text-gray-500"}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={hasSession && tier.featured ? "/dashboard/billing" : tier.href}
                className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                  tier.featured
                    ? "bg-blue-600 dark:bg-cyan-main hover:bg-blue-700 dark:hover:bg-cyan-main/90 text-white shadow-md hover:shadow-blue-500/30"
                    : "bg-white/40 dark:bg-white/5 text-text-main border border-slate-200/50 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10"
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
