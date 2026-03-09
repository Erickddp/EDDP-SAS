import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ParticlesBg } from "@/components/effects/particles-bg";
import { GridBg } from "@/components/effects/grid-bg";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MyFiscal - Asistente Fiscal Mexicano",
  description: "Respuestas fiscales claras, rápidas y con fundamento. Diseñado para contadores, PyMEs y contribuyentes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} antialiased selection:bg-cyan-main/30 bg-bg-main text-text-main min-h-screen relative`}>
        <GridBg />
        <ParticlesBg />
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
