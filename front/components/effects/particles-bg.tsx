"use client";

import { useEffect, useRef } from "react";

export function ParticlesBg() {
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
            const numParticles = Math.min(Math.floor(window.innerWidth / 20), 60); // Responsive amount, kept lightweight
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    s: Math.random() * 1.5 + 0.5, // size 0.5 to 2
                    vY: Math.random() * 0.4 + 0.1, // velocity Y (upwards)
                    op: Math.random() * 0.4 + 0.1, // opacity 0.1 to 0.5
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
                ctx.fillStyle = `rgba(83, 211, 255, ${p.op})`;
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
            className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60"
            aria-hidden="true"
        />
    );
}
