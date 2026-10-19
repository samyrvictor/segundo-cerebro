import { Captura } from "@/components/Captura";

export default function TextoPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">Guardar no cérebro</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Cole uma ideia, anotação ou trecho de aula — ou só um link (GitHub, artigo, Google Docs, vídeo) que o app busca o
        conteúdo para você.
      </p>

      <div className="mt-8">
        <Captura />
      </div>
    </div>
  );
}
