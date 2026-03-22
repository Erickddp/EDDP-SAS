"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileUp, 
  Database, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Gavel,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

type IngestStep = "idle" | "uploading" | "parsing" | "persisting" | "vectorizing" | "success" | "error";

interface IngestStats {
  articlesProcessed: number;
  embeddingsGenerated: number;
  document: string;
}

export default function AdminDashboard() {
  const [text, setText] = useState("");
  const [lawName, setLawName] = useState("");
  const [lawAbbr, setLawAbbr] = useState("");
  const [status, setStatus] = useState<IngestStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<IngestStats | null>(null);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !lawName || !lawAbbr) {
      setError("Faltan campos obligatorios (Nombre, Abreviatura o Texto).");
      setStatus("error");
      return;
    }

    setStatus("parsing");
    setError(null);
    setStats(null);

    try {
      const response = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lawName, lawAbbr, dryRun: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Fallo en el servidor");
      }

      setStats({
        articlesProcessed: data.articlesProcessed,
        embeddingsGenerated: data.embeddingsGenerated,
        document: data.document
      });
      setStatus("success");
      setText(""); // Clear after success
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  const steps = [
    { id: "parsing", label: "Normalización con IA", icon: Loader2 },
    { id: "persisting", label: "Persistencia SQL (UPSERT)", icon: Database },
    { id: "vectorizing", label: "Generación de Embeddings (HNSW)", icon: Zap },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Principal: Formulario de Ingesta */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="p-6 bg-bg-sec/50 border-border-glow backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6 text-cyan-main">
            <FileUp size={20} />
            <h2 className="text-xl font-bold text-text-main">Pipeline de Ingesta Masiva</h2>
          </div>

          <form onSubmit={handleIngest} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-sec">Nombre de la Ley (Completo)</label>
                <input 
                  type="text"
                  placeholder="Código Fiscal de la Federación"
                  value={lawName}
                  onChange={(e) => setLawName(e.target.value)}
                  className="w-full bg-bg-main border border-border-glow rounded-lg py-2 px-4 focus:ring-1 focus:ring-cyan-main outline-none text-text-main"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-sec">Abreviatura (ID Único)</label>
                <input 
                  type="text"
                  placeholder="CFF"
                  value={lawAbbr}
                  onChange={(e) => setLawAbbr(e.target.value)}
                  className="w-full bg-bg-main border border-border-glow rounded-lg py-2 px-4 focus:ring-1 focus:ring-cyan-main outline-none text-text-main"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-sec">Contenido crudo (Texto o PDF pegado)</label>
              <textarea 
                rows={12}
                placeholder="Pega aquí el contenido legal..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-bg-main border border-border-glow rounded-lg py-3 px-4 focus:ring-1 focus:ring-cyan-main outline-none text-text-main font-mono text-sm leading-relaxed"
                required
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-6 text-lg font-bold"
              disabled={status !== "idle" && status !== "success" && status !== "error"}
            >
              {status === "parsing" || status === "persisting" || status === "vectorizing" ? (
                <>
                  <Loader2 className="mr-2 animate-spin" /> Procesando Pipeline...
                </>
              ) : (
                "Iniciar Ingesta y Vectorización"
              )}
            </Button>
          </form>
        </Card>

        {/* Feedback de Proceso */}
        <AnimatePresence>
          {(status !== "idle" && status !== "success") && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
             >
                <Card className={cn(
                  "p-6 border-l-4",
                  status === "error" ? "border-l-red-500 bg-red-500/5" : "border-l-cyan-main bg-cyan-main/5"
                )}>
                  {status === "error" ? (
                    <div className="flex items-start gap-4">
                      <AlertCircle className="text-red-500 mt-1 shrink-0" />
                      <div>
                        <h3 className="font-bold text-red-500 text-lg">Error en el Pipeline</h3>
                        <p className="text-sm text-text-sec mt-1">{error}</p>
                        <Button variant="outline" size="sm" className="mt-4 border-red-500/30 text-red-500" onClick={() => setStatus("idle")}>
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <h3 className="font-bold text-cyan-main text-lg">Ejecutando Pipeline Asíncrono</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {steps.map((step, idx) => (
                            <div key={idx} className={cn(
                              "flex flex-col items-center p-4 rounded-xl border",
                              "bg-bg-main/50 border-border-glow opacity-40"
                            )}>
                              <step.icon size={24} className="mb-2" />
                              <span className="text-xs text-center font-medium">{step.label}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </Card>
             </motion.div>
          )}

          {status === "success" && stats && (
             <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-green-500/10 border border-green-500/30 p-8 text-center"
             >
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-extrabold text-green-500">Ingesta Exitosa: {stats.document}</h2>
                <div className="grid grid-cols-2 gap-4 mt-8">
                   <div className="bg-bg-main/50 p-4 rounded-xl border border-border-glow">
                      <p className="text-2xl font-bold text-text-main">{stats.articlesProcessed}</p>
                      <p className="text-xs text-text-sec uppercase tracking-widest">Artículos en SQL</p>
                   </div>
                   <div className="bg-bg-main/50 p-4 rounded-xl border border-border-glow">
                      <p className="text-2xl font-bold text-cyan-main">{stats.embeddingsGenerated}</p>
                      <p className="text-xs text-text-sec uppercase tracking-widest">Vectores HNSW</p>
                   </div>
                </div>
                <Button className="mt-8 bg-green-500 hover:bg-green-600 text-white" onClick={() => setStatus("idle")}>
                  Procesar nueva ley
                </Button>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar: Status del Corpus */}
      <div className="lg:col-span-4 space-y-6">
         <Card className="p-6 bg-bg-sec/50 border-border-glow backdrop-blur-md">
            <div className="flex items-center gap-2 mb-6 text-text-main">
              <Gavel size={20} className="text-cyan-main" />
              <h2 className="text-lg font-bold">Corpus Legal</h2>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 rounded-lg bg-bg-main/50 border border-border-glow">
                  <span className="text-sm font-medium">CFF (Fiscal)</span>
                  <span className="text-xs bg-cyan-main/20 text-cyan-main px-2 py-1 rounded">275 Art.</span>
               </div>
               <div className="flex justify-between items-center p-3 rounded-lg bg-bg-main/50 border border-border-glow">
                  <span className="text-sm font-medium">LISR (Renta)</span>
                  <span className="text-xs bg-cyan-main/20 text-cyan-main px-2 py-1 rounded">210 Art.</span>
               </div>
               <p className="text-xs text-text-sec text-center mt-4 italic">El sistema sincroniza automáticamente vectores faltantes.</p>
            </div>
         </Card>

         <Card className="p-6 bg-cyan-main/5 border-border-glow border-dashed">
            <div className="flex items-center gap-2 mb-4 text-cyan-main">
              <History size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Logs de Operación</h2>
            </div>
            <div className="space-y-2">
               <div className="text-[10px] font-mono text-text-sec flex gap-2">
                  <span className="text-cyan-main/50">[22:14:20]</span>
                  <span>Vector HNSW Index Refreshed</span>
               </div>
               <div className="text-[10px] font-mono text-text-sec flex gap-2">
                  <span className="text-cyan-main/50">[22:15:01]</span>
                  <span>Batch CFP-TEST Completed (2 Art)</span>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
}
