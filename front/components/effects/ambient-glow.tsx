import { cn } from "@/lib/utils";

export function AmbientGlow({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 transform",
                "h-[500px] w-full max-w-[1000px] rounded-full",
                "bg-cyan-main/15 opacity-50 blur-[120px] mix-blend-screen",
                className
            )}
            aria-hidden="true"
        />
    );
}
