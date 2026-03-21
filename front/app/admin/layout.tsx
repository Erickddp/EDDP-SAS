import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Header } from "@/components/layout/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // double check on top of proxy.ts for deep rendering safety
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-main">
      <Header user={session} hasSession={true} />
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 pt-24">
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-text-main">Panel de Control <span className="text-cyan-main">Admin</span></h1>
            <p className="text-text-sec">Gestión del Corpus Legal y Pipeline de Ingesta</p>
        </div>
        {children}
      </main>
    </div>
  );
}
