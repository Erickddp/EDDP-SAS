"use client";

import { motion } from "framer-motion";
import { UserCog, Database, MessageSquareText, BrainCircuit } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: UserCog,
    title: "Tu Perfil, Tu Regla",
    subtitle: "Captura de Contexto",
    description: "Dinámica inmediata. Define tu nivel de expertise y tu régimen fiscal. El sistema entiende exactamente quién eres desde la primera interacción.",
  },
  {
    id: 2,
    icon: Database,
    title: "Búsqueda en Tiempo Real",
    subtitle: "Análisis Normativo",
    description: "Cero conjeturas. El motor rastrea y cruza peticiones en bases de datos gubernamentales cien por ciento actualizadas para darte certeza jurídica.",
  },
  {
    id: 3,
    icon: MessageSquareText,
    title: "El Lenguaje que Entiendes",
    subtitle: "Traducción Adaptativa",
    description: "Olvídate del lenguaje técnico innavegable. Nuestro LLM ajusta el tono, la longitud y la complejidad directamente a tu nivel de experiencia.",
  },
  {
    id: 4,
    icon: BrainCircuit,
    title: "Memoria de Acero",
    subtitle: "Mejora Continua",
    description: "El sistema aprende de tu historial. Cada sesión, los consejos se vuelven más precisos, conformando tu propio consultor legal hiper-especializado.",
  }
];

export function ValueStorytelling() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-bg-sec relative overflow-hidden" id="como-funciona">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:32px]"></div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white"
          >
            Un motor jurídico que <span className="text-cyan-main">piensa, se adapta y evoluciona</span> contigo.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 dark:text-gray-400"
          >
            Descubre el flujo de valor diseñado para brindarte el control total de tu estrategia.
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
                className="relative flex flex-col items-start p-6 rounded-2xl bg-white dark:bg-[#121417] border border-gray-100 dark:border-border-glow shadow-xl shadow-gray-100/50 dark:shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-md transition-shadow group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 font-bold text-6xl italic group-hover:text-cyan-main group-hover:opacity-10 transition-all">
                  0{step.id}
                </div>
                
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-cyan-main/10 text-blue-600 dark:text-cyan-main flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 dark:group-hover:bg-cyan-main group-hover:text-white transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="space-y-3 relative z-10">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-blue-600 dark:text-cyan-main uppercase tracking-wider">{step.subtitle}</p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-main transition-colors">{step.title}</h3>
                  </div>
                  <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
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
