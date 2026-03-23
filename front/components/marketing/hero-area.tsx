"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Scale, Shield } from "lucide-react";

interface HeroAreaProps {
  hasSession?: boolean;
}

export function HeroArea({ hasSession }: HeroAreaProps) {
  return (
    <section className="relative overflow-hidden bg-bg-main pt-24 pb-20 md:pt-32 md:pb-32 lg:pb-40">
      {/* Background Effects Premium */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] bg-cyan-main/10 dark:bg-purple-600/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#D4AF37]/5 blur-[100px] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white dark:bg-[#121417] text-slate-900 dark:text-gray-100 border border-gray-200 dark:border-border-glow shadow-sm dark:shadow-none backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-main opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-main"></span>
              </span>
              <span className="text-cyan-main font-semibold mr-1">🚀 Evolución MyFiscal:</span> 
              De Asistente a Motor Jurídico
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight"
          >
            Inteligencia Jurídica Personalizada, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-main dark:to-[#8B5CF6]">a tu medida.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-600 dark:text-gray-400 max-w-3xl leading-relaxed"
          >
            Traducimos la complejidad de la jerga legal en estrategias de negocio accionables. Dominio absoluto de la normativa y fiscalidad mexicana, diseñado para escalar junto a ti hacia el mundo laboral y corporativo.
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#1A1D20] text-slate-900 dark:text-white border border-gray-200 dark:border-border-glow shadow-md shadow-gray-100/50 dark:shadow-none px-8 py-3.5 rounded-full font-semibold transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              Conoce el Nivel Pro ($99)
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="pt-10 flex items-center justify-center gap-6 text-slate-500 dark:text-text-sec/60 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Fiscal & Normativa MX</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-border-glow"></div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Seguridad Bancaria</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
