import { cn } from "@/lib/utils";

export function GlowLine({ className }: { className?: string }) {
    return (
        <div className={cn("relative h-[1px] w-16 bg-gradient-to-r from-transparent via-cyan-main to-transparent", className)}>
            <div className="absolute inset-0 bg-cyan-main blur-[4px]" aria-hidden="true" />
        </div>
    );
}
