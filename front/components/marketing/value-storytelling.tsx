"use client";

import { motion } from "framer-motion";
import { UserCog, Database, MessageSquareText, BrainCircuit } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: UserCog,
    title: "Tu Perfil, Tu Regla",
    subtitle: "Captura de Contexto",
    description: "Dinámica inmediata. Define tu nivel de expertise y tu régimen fiscal.",
  },
  {
    id: 2,
    icon: Database,
    title: "Búsqueda en Tiempo Real",
    subtitle: "Análisis Normativo",
    description: "El motor rastrea y cruza peticiones en bases de datos gubernamentales cien por ciento actualizadas.",
  },
  {
    id: 3,
    icon: MessageSquareText,
    title: "El Lenguaje que Entiendes",
    subtitle: "Traducción Adaptativa",
    description: "Nuestro LLM ajusta el tono y la complejidad directamente a tu nivel de experiencia.",
  },
  {
    id: 4,
    icon: BrainCircuit,
    title: "Memoria de Acero",
    subtitle: "Mejora Continua",
    description: "Cada sesión, los consejos se vuelven más precisos, conformando tu propio consultor hiper-especializado.",
  }
];

export function ValueStorytelling() {
  return (
    <section className="py-24 relative overflow-hidden" id="como-funciona">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-text-main"
          >
            Un motor jurídico que <span className="text-blue-600 dark:text-cyan-main">piensa y evoluciona</span> contigo.
          </motion.h2>
          <motion.p 
            className="text-lg text-text-sec"
          >
            Descubre el flujo de valor para brindarte el control total de tu estrategia.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex flex-col items-start p-6 rounded-2xl group transition-all bg-white/10 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-white/10 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-white/5"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.08] font-bold text-6xl italic group-hover:text-blue-600 dark:group-hover:text-cyan-main group-hover:opacity-20 transition-all text-text-main">
                  0{step.id}
                </div>
                
                <div className="h-12 w-12 rounded-xl bg-blue-50/50 dark:bg-cyan-main/10 text-blue-600 dark:text-cyan-main flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 dark:group-hover:bg-cyan-main group-hover:text-white transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="space-y-3 relative z-10">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-blue-600 dark:text-cyan-main uppercase tracking-wider">{step.subtitle}</p>
                    <h3 className="text-xl font-bold text-text-main group-hover:text-blue-600 dark:group-hover:text-cyan-main transition-colors">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-text-sec font-medium md:font-normal">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
