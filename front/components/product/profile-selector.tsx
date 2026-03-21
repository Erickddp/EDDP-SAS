"use client";

import { useState } from "react";
import { updateProfessionalProfile } from "@/lib/user-actions";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProfileOption {
    id: "entrepreneur" | "accountant" | "lawyer";
    title: string;
    description: string;
    icon: string;
}

const PROFILE_OPTIONS: ProfileOption[] = [
    {
        id: "entrepreneur",
        title: "Emprendedor / Dueño de Negocio",
        description: "Respuestas claras en lenguaje de negocios. Pasos a seguir (Action Items) y enfoque en impacto financiero.",
        icon: "💼"
    },
    {
        id: "accountant",
        title: "Contador / Especialista Fiscal",
        description: "Rigor técnico extremo. Desglose de bases gravables, tasas y citas exhaustivas de fracciones e incisos.",
        icon: "⚖️"
    },
    {
        id: "lawyer",
        title: "Abogado Jurídico",
        description: "Análisis normativo profundo. Enfoque en jerarquía legal, facultades de autoridad y medios de defensa.",
        icon: "🏛️"
    }
];

export function ProfileSelector({ currentProfile }: { currentProfile: string | null | undefined }) {
    const [selected, setSelected] = useState(currentProfile || "entrepreneur");
    const [loading, setLoading] = useState(false);

    const handleSelect = async (profile: "entrepreneur" | "accountant" | "lawyer") => {
        setLoading(true);
        try {
            await updateProfessionalProfile(profile);
            setSelected(profile);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROFILE_OPTIONS.map((option) => (
                <Card
                    key={option.id}
                    onClick={() => !loading && handleSelect(option.id)}
                    className={cn(
                        "relative cursor-pointer transition-all duration-300 border-2 hover:border-blue-500/50 hover:scale-[1.02]",
                        selected === option.id 
                            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                            : "border-transparent opacity-70 hover:opacity-100"
                    )}
                >
                    {selected === option.id && (
                        <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                             <Badge className="bg-blue-500 text-white border-none">Activo</Badge>
                        </div>
                    )}
                    
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {option.icon}
                    </div>
                    
                    <h3 className={cn(
                        "text-xl font-bold mb-2 transition-colors duration-300",
                        selected === option.id ? "text-blue-400" : "text-white/90"
                    )}>
                        {option.title}
                    </h3>
                    
                    <p className="text-white/60 text-sm leading-relaxed">
                        {option.description}
                    </p>

                    {loading && selected === option.id && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}
