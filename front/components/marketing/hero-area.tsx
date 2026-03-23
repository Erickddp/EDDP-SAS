"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroAreaProps {
  hasSession?: boolean;
}

export function HeroArea({ hasSession }: HeroAreaProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32 lg:pb-40">
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] bg-blue-400/10 dark:bg-purple-600/5 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/40 dark:bg-white/5 text-text-main border border-slate-200/50 dark:border-white/10 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-main opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-main"></span>
              </span>
              <span className="text-blue-600 dark:text-cyan-main font-semibold mr-1">🚀 Evolución MyFiscal:</span> 
              De Asistente a Motor Jurídico
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-main leading-tight"
          >
            Inteligencia Jurídica Personalizada, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-main dark:to-[#8B5CF6]">a tu medida.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-text-sec max-w-3xl leading-relaxed"
          >
            Traducimos la complejidad de la jerga legal en estrategias de negocio accionables. Dominio absoluto de la normativa y fiscalidad mexicana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto"
          >
            <Link 
              href={hasSession ? "/chat" : "/register"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 dark:bg-cyan-main hover:bg-blue-700 dark:hover:bg-cyan-main/90 text-white px-8 py-3.5 rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-cyan-main/25 group"
            >
              {hasSession ? "Ir al Motor" : "Empieza Gratis Ahora"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="#precios"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all bg-white/20 dark:bg-white/5 text-text-main border border-slate-200/50 dark:border-white/10 backdrop-blur-md hover:bg-white/40 dark:hover:bg-white/10 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-main" />
              Conoce el Nivel Pro ($99)
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
