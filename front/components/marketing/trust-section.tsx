"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Sliders, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Aprendizaje Aislado",
    description: "Usamos tus datos estrictamente para afinar tu modelo. Tu información jamás entrena redes públicas.",
    icon: ShieldCheck,
  },
  {
    title: "Encriptación de Extremo a Extremo",
    description: "Tu historial de consultas y perfiles permanecen bajo candados de seguridad de nivel bancario.",
    icon: Lock,
  },
  {
    title: "Control Total",
    description: "Tú decides. Gestiona, descarga y elimina tus configuraciones en cualquier momento.",
    icon: Sliders,
  },
];

export function TrustSection() {
  return (
    <section className="py-24 relative overflow-hidden border-t border-border-glow">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-white/20 dark:bg-white/5 text-text-main border border-border-glow shadow-sm backdrop-blur-md">
              <Lock className="w-4 h-4 text-blue-600 dark:text-cyan-main" />
              Privacidad por Diseño
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-main leading-tight">
              Tu estrategia es tuya. Nosotros la <span className="text-blue-600 dark:text-cyan-main">blindamos.</span>
            </h2>
            
            <p className="text-lg text-text-sec">
              Entendemos la naturaleza sensible de la información financiera y legal.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/20 dark:bg-white/5 border border-border-glow text-text-main font-medium transition-all hover:bg-white/40 dark:hover:bg-white/10 shadow-md"
              >
                Política de Privacidad
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid gap-6"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex gap-4 p-6 rounded-2xl group transition-all bg-white/10 dark:bg-white/5 backdrop-blur-md border border-border-glow hover:shadow-2xl hover:shadow-blue-500/5 dark:hover:shadow-white/5"
                >
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-blue-50/50 dark:bg-cyan-main/10 text-blue-600 dark:text-cyan-main flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 dark:group-hover:bg-cyan-main group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-main mb-2 group-hover:text-blue-600 dark:group-hover:text-cyan-main transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-text-sec text-sm leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
