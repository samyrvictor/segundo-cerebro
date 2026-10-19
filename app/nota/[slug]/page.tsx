import Link from "next/link";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { slugify } from "@/lib/slug";
import { lerFonte } from "@/lib/wiki";

export const dynamic = "force-dynamic";

// Transforma [[nome]] / [[nome|texto]] do Obsidian em links do app. O alvo é o
// nome do arquivo; o slug da nota é esse nome passado pelo slugify.
function comWikilinks(texto: string) {
  const partes = texto.split(/(\[\[[^\]]+\]\])/g);
  return partes.map((parte, i) => {
    const m = parte.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
    if (!m) return parte;
    const alvo = m[1].trim();
    return (
      <Link key={i} href={`/nota/${slugify(alvo)}`} className="text-primary underline underline-offset-2">
        {m[2] ?? alvo}
      </Link>
    );
  });
}

// Corpo da nota sem o frontmatter (frontmatter inválido = nota inteira).
function corpoDa(markdown: string): string {
  try {
    return matter(markdown).content;
  } catch {
    return markdown;
  }
}

export default async function NotaPage({ params }: PageProps<"/nota/[slug]">) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();

  const fonte = await lerFonte(slug);
  if (!fonte) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-8 pb-24 pt-14">
      <Link href="/buscar" className="text-sm text-muted hover:text-primary">
        ← Buscar
      </Link>
      <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em]">{fonte.titulo}</h1>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
        <span>{fonte.plataforma}</span>
        {fonte.assunto && <span className="text-primary">{fonte.assunto}</span>}
        <span>{fonte.data_ingestao}</span>
        {fonte.url && (
          <a href={fonte.url} target="_blank" rel="noreferrer" className="normal-case hover:text-primary">
            abrir original ↗
          </a>
        )}
      </div>
      <article className="painel mt-8 whitespace-pre-wrap p-6 text-[0.98rem] leading-relaxed sm:p-8">
        {comWikilinks(corpoDa(fonte.markdown).trim())}
      </article>
    </div>
  );
}
