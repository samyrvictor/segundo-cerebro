import type { ItemDia } from "./dia";
import { db, ok, talvez } from "./db";

// --- Rotina do dia (cada dia tem seus próprios itens, criados na hora) ----

const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

export function dataValida(data: unknown): data is string {
  return typeof data === "string" && DATA_VALIDA.test(data);
}

export async function lerDia(data: string): Promise<ItemDia[]> {
  return ok(await db().from("itens_dia").select("id, texto, feito").eq("data", data).order("ordem"));
}

// Mapa data -> itens, de todos os dias do ano (pro calendário da Rotina).
export async function lerAno(ano: number): Promise<Record<string, ItemDia[]>> {
  const linhas = ok(
    await db()
      .from("itens_dia")
      .select("data, id, texto, feito")
      .gte("data", `${ano}-01-01`)
      .lte("data", `${ano}-12-31`)
      .order("ordem")
  );
  const resultado: Record<string, ItemDia[]> = {};
  for (const { data, ...item } of linhas) (resultado[data] ??= []).push(item);
  return resultado;
}

export async function adicionarItemDia(data: string, texto: string): Promise<ItemDia> {
  const ultimo = talvez(
    await db().from("itens_dia").select("ordem").eq("data", data).order("ordem", { ascending: false }).limit(1).maybeSingle()
  );
  const ordem = (ultimo?.ordem ?? 0) + 1;
  return ok(await db().from("itens_dia").insert({ data, texto, ordem }).select("id, texto, feito").single());
}

export async function marcarItemDia(id: number, feito: boolean): Promise<void> {
  ok(await db().from("itens_dia").update({ feito }).eq("id", id));
}

export async function removerItemDia(id: number): Promise<void> {
  ok(await db().from("itens_dia").delete().eq("id", id));
}

// Textos usados nos últimos 30 dias, mais recentes primeiro, sem repetir —
// pra não precisar digitar de novo algo que você já fez outro dia.
export async function sugestoesItens(): Promise<string[]> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  const linhas = ok(
    await db()
      .from("itens_dia")
      .select("texto, data")
      .gte("data", desde.toISOString().slice(0, 10))
      .order("data", { ascending: false })
  );
  const vistos = new Set<string>();
  const sugestoes: string[] = [];
  for (const { texto } of linhas) {
    if (vistos.has(texto)) continue;
    vistos.add(texto);
    sugestoes.push(texto);
    if (sugestoes.length >= 12) break;
  }
  return sugestoes;
}

// --- Estudos -------------------------------------------------------------

export interface SecaoEstudos {
  nome: string;
  topicos: { texto: string; feito: boolean }[];
}

// Seções na ordem em que aparecem pela primeira vez (id crescente).
export async function lerEstudos(): Promise<SecaoEstudos[]> {
  const linhas = ok(await db().from("estudos").select("secao, topico, feito").order("id"));
  const secoes: SecaoEstudos[] = [];
  for (const { secao, topico, feito } of linhas) {
    let s = secoes.find((x) => x.nome === secao);
    if (!s) secoes.push((s = { nome: secao, topicos: [] }));
    s.topicos.push({ texto: topico, feito });
  }
  return secoes;
}

export async function marcarEstudo(topico: string, feito: boolean): Promise<void> {
  ok(await db().from("estudos").update({ feito }).eq("topico", topico));
}

// Acrescenta um tópico no fim da seção indicada.
export async function adicionarEstudo(secao: string, topico: string): Promise<void> {
  const { error } = await db().from("estudos").insert({ secao, topico });
  if (error?.code === "23505") throw new Error(`"${topico}" já está na lista.`);
  if (error) throw new Error(error.message);
}

export async function removerEstudo(topico: string): Promise<void> {
  ok(await db().from("estudos").delete().eq("topico", topico));
}

// --- Semana --------------------------------------------------------------

export interface LinhaSemana {
  ordem: number;
  dia: string;
  manha: string;
  noite: string;
}

export async function lerLinhasSemana(): Promise<LinhaSemana[]> {
  return ok(await db().from("semana").select("ordem, dia, manha, noite").order("ordem"));
}

export async function salvarCelulaSemana(ordem: number, campo: "manha" | "noite", valor: string): Promise<void> {
  ok(await db().from("semana").update({ [campo]: valor.trim() || "—" }).eq("ordem", ordem));
}

// Linhas da tabela da semana, com o cabeçalho primeiro.
export async function lerSemana(): Promise<string[][]> {
  const linhas = ok(await db().from("semana").select("dia, manha, noite").order("ordem"));
  return [["Dia", "Manhã", "Noite"], ...linhas.map((l) => [l.dia, l.manha, l.noite])];
}
