import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({ className, children, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "cyan" }) {
    const variants = {
        default: "bg-bg-sec border border-border-glow text-text-sec",
        outline: "border border-cyan-main/30 text-cyan-main",
        cyan: "bg-cyan-main/10 border border-cyan-main/30 text-cyan-glow",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
