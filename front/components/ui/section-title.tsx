import { cn } from "@/lib/utils";
import { GlowLine } from "./glow-line";

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    align?: "left" | "center";
    className?: string;
}

export function SectionTitle({ title, subtitle, align = "center", className }: SectionTitleProps) {
    return (
        <div className={cn("flex flex-col space-y-4", align === "center" ? "items-center text-center" : "items-start text-left", className)}>
            <h2 className="text-3xl font-bold tracking-tight text-text-main md:text-4xl lg:text-5xl">
                {title}
            </h2>
            {subtitle && (
                <p className="max-w-[700px] text-lg text-text-sec md:text-xl">
                    {subtitle}
                </p>
            )}
            <GlowLine className={cn("mt-4", align === "center" && "mx-auto")} />
        </div>
    );
}
