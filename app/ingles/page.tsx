import { InglesView } from "@/components/InglesView";

export default function InglesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">Inglês, rumo ao C1</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Método natural com input compreensível, 30 minutos por dia. O progresso também aparece em{" "}
        <code className="rounded bg-black/[0.04] px-1">rotina/ingles.md</code> no Obsidian.
      </p>
      <InglesView />
    </div>
  );
}
