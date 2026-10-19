import { EstudosView } from "@/components/EstudosView";

export default function EstudosPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">Estudos</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Marque o que você já domina, adicione ou tire tópicos. &ldquo;buscar&rdquo; mostra tudo que o cérebro já tem sobre o
        assunto.
      </p>
      <EstudosView />
    </div>
  );
}
