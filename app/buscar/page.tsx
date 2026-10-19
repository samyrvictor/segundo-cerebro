import { BuscaForm } from "@/components/BuscaForm";
import { FontesRecentes } from "@/components/FontesRecentes";

export default async function BuscarPage({ searchParams }: PageProps<"/buscar">) {
  const { q } = await searchParams;
  const inicial = typeof q === "string" ? q : "";
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <BuscaForm key={inicial} inicial={inicial} />
      {!inicial && (
        <section className="mt-14" aria-labelledby="titulo-recentes">
          <h2 id="titulo-recentes" className="font-display text-lg font-semibold">
            Entraram por último
          </h2>
          <FontesRecentes />
        </section>
      )}
    </div>
  );
}
