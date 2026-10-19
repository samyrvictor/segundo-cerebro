import { SincronizarView } from "@/components/SincronizarView";

export default async function SincronizarPage({ searchParams }: PageProps<"/sincronizar">) {
  const { erro, conectado } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">Sincronizar</h1>
      <p className="mt-2 max-w-md text-sm text-muted">De onde o seu cérebro recebe conteúdo, e quando foi a última vez.</p>
      <SincronizarView aviso={{ erro: typeof erro === "string" ? erro : undefined, conectado: Boolean(conectado) }} />
    </div>
  );
}
