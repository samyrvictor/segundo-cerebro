import { Grafo } from "@/components/Grafo";

export default function GrafoPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">Grafo</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Suas notas ligadas pelos <code className="rounded bg-black/[0.04] px-1">[[links]]</code>, como no Obsidian. Role para dar
        zoom, arraste para mover e clique num ponto para abrir a nota.
      </p>
      <Grafo />
    </div>
  );
}
