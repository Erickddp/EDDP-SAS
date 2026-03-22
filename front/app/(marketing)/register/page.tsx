"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, googleLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, undefined);

  return (
    <>
      <Header />
      <main className="flex-1 relative w-full pt-32 pb-20">
        <Container>
          <div className="mx-auto max-w-md w-full">
            <div className="rounded-2xl border border-cyan-main/20 bg-bg-sec/50 p-8 shadow-xl backdrop-blur-xl">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-main mb-2">Crear Cuenta</h1>
                <p className="text-text-sec">Únete a MyFiscal para comenzar</p>
              </div>

              <div className="space-y-4">
                <form action={googleLogin}>
                  <Button type="submit" variant="outline" className="w-full bg-white text-gray-900 hover:bg-gray-50 border-gray-200 flex items-center justify-center gap-3 py-6 shadow-sm group transition-all">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.12-.85 2.07-1.8 2.7l2.91 2.26c1.7-1.57 2.69-3.88 2.69-6.61z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.19l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71l-3 2.32C2.45 15.63 5.39 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7l-3-2.32C.36 6.01 0 7.46 0 9c0 1.54.36 2.99 1.01 4.3l3-2.3z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.39 0 2.45 2.37 1.01 5.68l3 2.32C4.68 5.16 6.66 3.58 9 3.58z"/>
                    </svg>
                    <span className="font-semibold tracking-tight">Continuar con Google</span>
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-glow/40"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-bg-sec/50 px-2 text-text-sec font-medium tracking-wider backdrop-blur-sm">O registro local</span>
                  </div>
                </div>

                <form action={formAction} className="space-y-6">
                  {state?.error && (
                    <div className="rounded-md bg-red-950/50 p-3 text-sm text-red-400 border border-red-900/50">
                      {state.error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2" htmlFor="name">
                      Nombre completo
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="w-full rounded-lg border border-border-glow bg-bg-main px-4 py-2.5 text-text-main placeholder:text-text-sec/50 focus:border-cyan-main focus:outline-none focus:ring-1 focus:ring-cyan-main transition-colors"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-lg border border-border-glow bg-bg-main px-4 py-2.5 text-text-main placeholder:text-text-sec/50 focus:border-cyan-main focus:outline-none focus:ring-1 focus:ring-cyan-main transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2" htmlFor="password">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full rounded-lg border border-border-glow bg-bg-main px-4 py-2.5 text-text-main placeholder:text-text-sec/50 focus:border-cyan-main focus:outline-none focus:ring-1 focus:ring-cyan-main transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Registrarse
                  </Button>
                </form>
              </div>

              <div className="mt-6 text-center text-sm text-text-sec">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-cyan-main hover:text-cyan-glow transition-colors">
                  Inicia sesión
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
