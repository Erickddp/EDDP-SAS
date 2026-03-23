"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Sliders, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Aprendizaje Aislado",
    description: "Usamos los datos de tu perfil estrictamente para afinar el modelo de respuesta solo para ti. Tu información jamás entrena redes neuronales públicas.",
    icon: ShieldCheck,
  },
  {
    title: "Enciptación Extremo a Extremo",
    description: "Tu historial de consultas, perfiles y las estrategias delineadas permanecen bajo robustos candados de seguridad de nivel bancario.",
    icon: Lock,
  },
  {
    title: "Control Total",
    description: "Tú decides. Gestiona, descarga y elimina tus configuraciones y memoria de sesión en cualquier momento. Cumplimiento legal garantizado.",
    icon: Sliders,
  },
];

export function TrustSection() {
  return (
    <section className="py-24 relative bg-slate-50 dark:bg-bg-sec border-t border-gray-100 dark:border-border-glow overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-blue-100/50 dark:bg-cyan-main/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-indigo-100/50 dark:bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-white dark:bg-[#1A1D20] text-slate-900 dark:text-white border border-gray-200 dark:border-border-glow shadow-sm dark:shadow-none">
              <Lock className="w-4 h-4 text-blue-600 dark:text-cyan-main" />
              Privacidad por Diseño
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Tu estrategia es tuya. Nosotros la <span className="text-blue-600 dark:text-cyan-main">blindamos.</span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-gray-400">
              Entendemos la naturaleza sensible de la información financiera y legal.
              Por ello, tu privacidad no es opcional, es el núcleo innegociable de nuestra arquitectura.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#121417] border border-gray-200 dark:border-border-glow shadow-md shadow-gray-100/50 dark:shadow-none hover:bg-slate-50 dark:hover:bg-[#1A1D20] text-slate-900 dark:text-white font-medium transition-colors"
              >
                Política de Privacidad
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-main font-medium transition-colors"
              >
                Leer Términos
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
                  className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-[#121417] border border-gray-100 dark:border-border-glow shadow-xl shadow-gray-100/50 dark:shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-md transition-shadow group"
                >
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-cyan-main/10 flex items-center justify-center text-blue-600 dark:text-cyan-main group-hover:bg-blue-600 dark:group-hover:bg-cyan-main group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-cyan-main transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
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
