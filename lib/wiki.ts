import { hojeISO } from "./datas";
import { db, ok, talvez } from "./db";
import { slugify } from "./slug";

// O vault (Obsidian) é gerado a partir do banco pelo sincronizador
// (scripts/sincronizar.ts); aqui só se grava no banco. A coluna `markdown`
// guarda o arquivo .md inteiro, como ele vai aparecer no vault.

export interface Fonte {
  slug: string;
  caminho: string;
  titulo: string;
  plataforma: string;
  url: string | null;
  assunto: string | null;
  tags: string[];
  data_ingestao: string;
  markdown: string;
}

async function proximoSlugDisponivel(base: string): Promise<string> {
  const usados = ok(await db().from("fontes").select("slug").like("slug", `${base}%`));
  const existentes = new Set(usados.map((u) => u.slug as string));
  let slug = base;
  for (let contador = 2; existentes.has(slug); contador++) slug = `${base}-${contador}`;
  return slug;
}

function escaparYaml(valor: string): string {
  return valor.replace(/"/g, '\\"');
}

// Deriva um título curto da primeira linha do texto colado.
function tituloDoTexto(texto: string): string {
  const primeiraLinha = texto.split("\n").find((l) => l.trim())?.trim() ?? "";
  return primeiraLinha.slice(0, 80) || "Nota sem título";
}

const hoje = hojeISO;

export async function registrarLog(acao: string, titulo: string) {
  ok(await db().from("log").insert({ data: hoje(), acao, titulo }));
}

interface SalvarTextoOpts {
  texto: string;
  titulo?: string;
  url?: string;
  plataforma?: string;
  assunto?: string;
}

// Salva um texto (colado direto, ou buscado de um link) como página
// tipo:fonte, sem passar por IA — nem o conteúdo digitado por você, nem o
// texto puro de uma página/README precisam de resumo automático.
export async function salvarTextoBruto(opts: SalvarTextoOpts) {
  const titulo = opts.titulo?.trim() || tituloDoTexto(opts.texto);
  const slug = await proximoSlugDisponivel(slugify(titulo));
  const dataIngestao = hoje();
  const plataforma = opts.plataforma ?? "texto colado";

  const frontmatter = [
    "---",
    "tipo: fonte",
    `titulo: "${escaparYaml(titulo)}"`,
    opts.url ? `url: ${opts.url}` : undefined,
    `plataforma: ${plataforma}`,
    opts.assunto ? `assunto: "${escaparYaml(opts.assunto)}"` : undefined,
    `data_ingestao: "${dataIngestao}"`,
    "tags: []",
    "---",
    "",
  ]
    .filter((linha): linha is string => linha !== undefined)
    .join("\n");

  const corpo = `# ${titulo}\n\n${opts.texto.trim()}\n`;

  ok(
    await db()
      .from("fontes")
      .insert({
        slug,
        caminho: `wiki/fontes/${slug}.md`,
        titulo,
        plataforma,
        url: opts.url ?? null,
        assunto: opts.assunto ?? null,
        data_ingestao: dataIngestao,
        markdown: `${frontmatter}${corpo}`,
      })
  );
  await registrarLog("ingest", titulo);

  return { slug };
}

interface SalvarPaginaFixaOpts {
  slug: string;
  titulo: string;
  plataforma: string;
  corpo: string;
}

// Igual a salvarTextoBruto, mas para páginas com slug fixo que são
// regeneradas por completo a cada sincronização (espelho do Notion, dos
// favoritos do Chrome) em vez de nascerem uma vez e nunca mais mudarem.
export async function salvarPaginaFixa(opts: SalvarPaginaFixaOpts) {
  const dataIngestao = hoje();
  const frontmatter = [
    "---",
    "tipo: fonte",
    `titulo: "${escaparYaml(opts.titulo)}"`,
    `plataforma: ${opts.plataforma}`,
    `data_ingestao: "${dataIngestao}"`,
    "tags: []",
    "---",
    "",
  ].join("\n");

  ok(
    await db()
      .from("fontes")
      .upsert({
        slug: opts.slug,
        caminho: `wiki/fontes/${opts.slug}.md`,
        titulo: opts.titulo,
        plataforma: opts.plataforma,
        data_ingestao: dataIngestao,
        markdown: `${frontmatter}${opts.corpo}\n`,
        atualizado_em: new Date().toISOString(),
      })
  );
  await registrarLog("sync", opts.titulo);

  return { slug: opts.slug };
}

// Mapa url -> slug de tudo que já foi trazido pro wiki. Usado pelos
// sincronizadores em lote (Chrome, Notion) pra não duplicar página numa
// sincronização seguinte.
export async function mapaUrlsIngeridas(): Promise<Map<string, string>> {
  const linhas = ok(await db().from("fontes").select("slug, url").not("url", "is", null));
  return new Map(linhas.map((l) => [l.url as string, l.slug as string]));
}

export async function lerFonte(slug: string): Promise<Fonte | null> {
  return talvez(await db().from("fontes").select("*").eq("slug", slug).maybeSingle());
}
