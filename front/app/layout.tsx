import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ParticlesBg } from "@/components/effects/particles-bg";
import { GridBg } from "@/components/effects/grid-bg";
import { ThemeProvider, themeScript } from "@/components/theme/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MyFiscal - Asistente Fiscal Mexicano",
  description: "Respuestas fiscales claras, rapidas y con fundamento. Disenado para contadores, PyMEs y contribuyentes.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased selection:bg-cyan-main/30 bg-bg-main text-text-main min-h-screen relative`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <GridBg />
          <ParticlesBg />
          <div className="relative z-10 flex min-h-screen flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
