"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ParticlesBgProps {
    className?: string;
    density?: number;
    maxParticles?: number;
    sizeRange?: [number, number];
    speedRange?: [number, number];
    opacityRange?: [number, number];
    color?: string;
}

export function ParticlesBg({
    className,
    density = 10,
    maxParticles = 180,
    sizeRange = [0.8, 3.2],
    speedRange = [0.2, 0.8],
    opacityRange = [0.2, 0.7],
    color = "14, 165, 233"
}: ParticlesBgProps = {}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{ x: number; y: number; s: number; vY: number; op: number }> = [];

        const initParticles = () => {
            particles = [];
            const numParticles = Math.min(Math.floor(window.innerWidth / density), maxParticles);
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    s: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
                    vY: Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0],
                    op: Math.random() * (opacityRange[1] - opacityRange[0]) + opacityRange[0],
                });
            }
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.y -= p.vY;
                // If particle goes above screen, reset it at bottom
                if (p.y < -10) {
                    p.y = canvas.height + 10;
                    p.x = Math.random() * canvas.width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color}, ${p.op})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener("resize", resize);
        resize();
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={cn(
                "pointer-events-none fixed inset-0 z-0 h-full w-full opacity-40 transition-opacity duration-1000",
                className
            )}
            aria-hidden="true"
        />
    );
}
