import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { volta } = await searchParams;
  // Só volta para caminhos do próprio app (evita redirecionar para outro site).
  const destino = typeof volta === "string" && volta.startsWith("/") && !volta.startsWith("//") ? volta : "/";

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold tracking-[-0.03em]">Segundo Cérebro</h1>
        <p className="mt-2 text-sm text-muted">Digite sua senha para entrar.</p>
        <LoginForm destino={destino} />
      </div>
    </div>
  );
}
