"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <>
      <Header />
      <main className="flex-1 relative w-full pt-32 pb-20">
        <Container>
          <div className="mx-auto max-w-md w-full">
            <div className="rounded-2xl border border-cyan-main/20 bg-bg-sec/50 p-8 shadow-xl backdrop-blur-xl">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-main mb-2">Bienvenido de nuevo</h1>
                <p className="text-text-sec">Inicia sesión en tu cuenta de MyFiscal</p>
              </div>

              <form action={formAction} className="space-y-6">
                {state?.error && (
                  <div className="rounded-md bg-red-950/50 p-3 text-sm text-red-400 border border-red-900/50">
                    {state.error}
                  </div>
                )}
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
                  Iniciar Sesión
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-text-sec">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-cyan-main hover:text-cyan-glow transition-colors">
                  Regístrate
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
