import { RotinaView } from "@/components/RotinaView";

export default function RotinaPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">Rotina</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        O ano inteiro, mês a mês. Clique num dia para ver, marcar e escrever o que você precisa fazer nele — cada dia é
        o seu.
      </p>
      <RotinaView />
    </div>
  );
}
