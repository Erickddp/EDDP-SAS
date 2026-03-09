import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

export interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
        const baseClass = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-main focus:ring-offset-2 focus:ring-offset-bg-main disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
            primary: "bg-cyan-main text-bg-main shadow-[0_0_15px_rgba(32,196,255,0.4)] hover:bg-cyan-glow hover:shadow-[0_0_20px_rgba(83,211,255,0.6)]",
            secondary: "bg-bg-sec text-text-main border border-border-glow hover:border-cyan-main/50 hover:bg-bg-sec/80",
            outline: "border border-cyan-main/30 text-cyan-main hover:bg-cyan-main/10",
            ghost: "text-text-sec hover:text-text-main hover:bg-bg-sec",
        };

        const sizes = {
            sm: "h-9 px-4 text-sm",
            md: "h-11 px-6 text-base",
            lg: "h-14 px-8 text-lg font-semibold",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(baseClass, variants[variant], sizes[size], className)}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);
Button.displayName = "Button";
