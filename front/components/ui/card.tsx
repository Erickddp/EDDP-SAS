import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "glass-card p-6",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = "Card";
