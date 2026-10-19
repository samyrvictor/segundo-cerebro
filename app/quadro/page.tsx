import { QuadroView } from "@/components/QuadroView";

export default function QuadroPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">Quadro</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        O que você tem para fazer — estudo, trabalho, pessoal. Arraste os cartões entre as colunas; no celular, use o
        botão de opções do cartão.
      </p>
      <QuadroView />
    </div>
  );
}
