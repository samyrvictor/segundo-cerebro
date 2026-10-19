import path from "node:path";
import matter from "gray-matter";
import type { SecaoEstudos } from "./rotina";
import { AREAS, COLUNAS, type Area, type Coluna, type Tarefa } from "./quadro";

// Formato dos arquivos do vault (Obsidian). O sincronizador usa estas funções
// nos dois sentidos: render (banco → arquivo) e parse (arquivo → banco).

const LINHA_CHECKBOX = /^\s*- \[( |x|X)\] (.*)$/;

export function lerItens(conteudo: string): { texto: string; feito: boolean }[] {
  return conteudo
    .split("\n")
    .map((linha) => linha.match(LINHA_CHECKBOX))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ texto: m[2].trim(), feito: m[1].toLowerCase() === "x" }));
}

// --- Diário (rotina/diario/AAAA-MM-DD.md) ---------------------------------
// Cada dia é uma lista simples do que você colocou pra fazer naquele dia —
// sem lista fixa por trás; o que aparece aqui é só o que você escreveu.

export function renderDiario(data: string, itens: { texto: string; feito: boolean }[]): string {
  const [ano, mes, dia] = data.split("-");
  return [
    "---",
    "tipo: diario",
    `data: "${data}"`,
    "---",
    `# ${dia}/${mes}/${ano}`,
    "",
    ...itens.map((i) => `- [${i.feito ? "x" : " "}] ${i.texto}`),
    "",
  ].join("\n");
}

export function parseDiario(conteudo: string): { texto: string; feito: boolean }[] {
  return lerItens(conteudo);
}

// --- Inglês (rotina/ingles.md) — o render fica em lib/ingles/plano.ts -------

export function parseIngles(conteudo: string): string[] {
  return lerItens(conteudo)
    .filter((i) => i.feito)
    .map((i) => i.texto.match(/<!-- id:(S\d{2}D[1-7]) -->/)?.[1])
    .filter((id): id is string => Boolean(id));
}

// --- Estudos (rotina/estudos.md) ------------------------------------------

export function renderEstudos(secoes: SecaoEstudos[]): string {
  const partes = [
    "---",
    "tipo: estudos",
    "---",
    "# Estudos",
    "",
    "Marque o que você já domina. Edite à vontade aqui no Obsidian — o app lê",
    "este arquivo.",
  ];
  for (const secao of secoes) {
    partes.push("", `## ${secao.nome}`, ...secao.topicos.map((t) => `- [${t.feito ? "x" : " "}] ${t.texto}`));
  }
  return partes.join("\n") + "\n";
}

export function parseEstudos(conteudo: string): SecaoEstudos[] {
  return conteudo
    .split(/^## /m)
    .slice(1)
    .map((bloco) => {
      const [titulo, ...resto] = bloco.split("\n");
      return { nome: titulo.trim(), topicos: lerItens(resto.join("\n")) };
    });
}

// --- Semana (rotina/semana.md) --------------------------------------------

export function renderSemana(linhas: string[][]): string {
  const [cabecalho = ["Dia", "Manhã", "Noite"], ...corpo] = linhas;
  return [
    "---",
    "tipo: semana",
    "---",
    "# Semana",
    "",
    "Edite aqui no Obsidian — o app mostra esta tabela no Início.",
    "",
    `| ${cabecalho.join(" | ")} |`,
    `|${cabecalho.map(() => "---").join("|")}|`,
    ...corpo.map((l) => `| ${l.join(" | ")} |`),
    "",
  ].join("\n");
}

// Linhas da tabela, com o cabeçalho primeiro (mesma forma de lerSemana).
export function parseSemana(conteudo: string): string[][] {
  return conteudo
    .split("\n")
    .filter((l) => l.trim().startsWith("|") && !/^\|\s*-/.test(l.trim()))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim())
    );
}

// --- Quadro (rotina/quadro.md) — formato do plugin Kanban do Obsidian -------

export function renderQuadro(tarefas: Tarefa[]): string {
  const partes = ["---", "kanban-plugin: basic", "tipo: quadro", "---", ""];
  for (const coluna of COLUNAS) {
    partes.push(`## ${coluna.nome}`, "");
    for (const t of tarefas.filter((x) => x.coluna === coluna.id)) {
      partes.push(`- [${coluna.id === "feito" ? "x" : " "}] ${t.titulo}${t.area ? ` #${t.area}` : ""}`);
    }
    partes.push("");
  }
  return partes.join("\n");
}

export function parseQuadro(conteudo: string): { titulo: string; coluna: Coluna; area: Area | null }[] {
  const cartoes: { titulo: string; coluna: Coluna; area: Area | null }[] = [];
  for (const bloco of conteudo.split(/^## /m).slice(1)) {
    const [cabecalho, ...resto] = bloco.split("\n");
    const coluna = COLUNAS.find((c) => c.nome.toLowerCase() === cabecalho.trim().toLowerCase())?.id;
    if (!coluna) continue;
    for (const item of lerItens(resto.join("\n"))) {
      const tag = item.texto.match(/\s#(\w+)\s*$/)?.[1];
      const area = AREAS.find((a) => a.id === tag)?.id ?? null;
      const titulo = (area ? item.texto.replace(/\s#\w+\s*$/, "") : item.texto).trim();
      if (titulo) cartoes.push({ titulo, coluna, area });
    }
  }
  return cartoes;
}

// --- Notas (wiki/**/*.md) -------------------------------------------------

export interface MetadadosNota {
  titulo: string;
  plataforma: string;
  url: string | null;
  assunto: string | null;
  tags: string[];
  data_ingestao: string;
  tipo: string;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function dataIso(valor: unknown): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor.toISOString().slice(0, 10);
  const t = texto(valor);
  return t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

// Lê o frontmatter de uma nota; nota escrita no Obsidian sem frontmatter cai
// para o 1º título "# " e depois para o nome do arquivo.
export function metadadosDaNota(caminho: string, markdown: string, hoje: string): MetadadosNota {
  let dados: Record<string, unknown> = {};
  let corpo = markdown;
  try {
    const m = matter(markdown);
    dados = m.data;
    corpo = m.content;
  } catch {
    // frontmatter inválido: trata a nota inteira como texto
  }
  const primeiroTitulo = corpo.match(/^# (.+)$/m)?.[1]?.trim();
  return {
    titulo: texto(dados.titulo) ?? primeiroTitulo ?? path.posix.basename(caminho, ".md"),
    plataforma: texto(dados.plataforma) ?? "obsidian",
    url: texto(dados.url),
    assunto: texto(dados.assunto),
    tags: Array.isArray(dados.tags) ? dados.tags.filter((t): t is string => typeof t === "string") : [],
    data_ingestao: dataIso(dados.data_ingestao) ?? hoje,
    tipo: texto(dados.tipo) ?? "fonte",
  };
}

// --- index.md e log.md (só banco → vault) ---------------------------------

export function renderIndex(notas: { caminho: string; titulo: string; tipo: string }[]): string {
  const porTipo = new Map<string, string[]>();
  for (const n of notas) {
    const resumo = n.titulo.split(/\.\s/)[0].slice(0, 100);
    const lista = porTipo.get(n.tipo) ?? [];
    lista.push(`- [[${path.posix.basename(n.caminho, ".md")}]] — ${resumo}`);
    porTipo.set(n.tipo, lista);
  }
  const partes = ["# Índice", "", "Catálogo de todas as páginas do wiki, por categoria. Atualizado a cada ingest."];
  for (const [tipo, linhas] of porTipo) {
    partes.push("", `## ${tipo}`, ...linhas);
  }
  return partes.join("\n") + "\n";
}

export interface EntradaLog {
  data: string;
  acao: string;
  titulo: string;
}

export function renderLog(entradas: EntradaLog[]): string {
  const partes = ["# Log", "", "Registro cronológico append-only de ingests, queries e lints."];
  for (const e of entradas) {
    partes.push("", `## [${e.data}] ${e.acao} | ${e.titulo}`);
  }
  return partes.join("\n") + "\n";
}

export function parseLog(conteudo: string): EntradaLog[] {
  return [...conteudo.matchAll(/^## \[(\d{4}-\d{2}-\d{2})\] (\S+) \| (.*)$/gm)].map((m) => ({
    data: m[1],
    acao: m[2],
    titulo: m[3].trim(),
  }));
}
