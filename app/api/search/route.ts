import matter from "gray-matter";
import { NextRequest } from "next/server";
import { db, ok } from "@/lib/db";
import { SEMANAS } from "@/lib/ingles/plano";
import { contar, normalizar, termosDaBusca, trechoEmVolta } from "@/lib/texto";

export const runtime = "nodejs";

// Busca em tudo que o cérebro guarda: notas (de qualquer origem), tópicos de
// estudo, cartões do quadro e o plano de Inglês. Sem acento, aceita pedaço de
// palavra ("reac" acha "React").

function corpoDa(markdown: string): string {
  try {
    return matter(markdown).content;
  } catch {
    return markdown;
  }
}

const contem = (texto: string, termos: string[]) => {
  const n = normalizar(texto);
  return termos.every((t) => n.includes(t));
};

async function buscarNotas(termos: string[]) {
  // Full-text do Postgres (config "pt" sem acento) com prefixo em cada palavra.
  const consulta = termos.map((t) => `${t.replace(/[^\p{L}\p{N}]/gu, "")}:*`).join(" & ");
  const linhas = ok(
    await db()
      .from("fontes")
      .select("slug, titulo, plataforma, data_ingestao, tags, markdown")
      .textSearch("busca", consulta, { config: "pt" })
      .limit(60)
  );

  return linhas
    .map((f) => {
      const corpo = corpoDa(f.markdown);
      const score = termos.reduce((s, t) => s + contar(f.titulo, t) * 5 + Math.min(contar(corpo, t), 20), 0);
      return {
        slug: f.slug as string,
        titulo: f.titulo as string,
        plataforma: f.plataforma as string,
        data_ingestao: f.data_ingestao as string,
        trecho: trechoEmVolta(corpo, termos),
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
}

async function buscarEstudos(termos: string[]) {
  const linhas = ok(await db().from("estudos").select("secao, topico, feito").order("id"));
  return linhas.filter((e) => contem(`${e.topico} ${e.secao}`, termos));
}

async function buscarQuadro(termos: string[]) {
  const linhas = ok(await db().from("tarefas").select("id, titulo, coluna, area").order("ordem"));
  return linhas.filter((t) => contem(t.titulo, termos));
}

function buscarIngles(termos: string[]) {
  const achados: { semana: number; tema: string; tipo: string; texto: string }[] = [];
  for (const s of SEMANAS) {
    if (contem(s.tema, termos)) achados.push({ semana: s.numero, tema: s.tema, tipo: "Tema", texto: s.tema });
    const gramatica = `${s.gramatica.titulo} ${s.gramatica.explicacao} ${s.gramatica.exemplos.join(" ")}`;
    if (contem(gramatica, termos)) {
      achados.push({ semana: s.numero, tema: s.tema, tipo: "Gramática", texto: s.gramatica.titulo });
    }
    for (const [en, pt] of s.vocab) {
      if (contem(`${en} ${pt}`, termos)) achados.push({ semana: s.numero, tema: s.tema, tipo: "Palavra", texto: `${en} — ${pt}` });
    }
  }
  return achados.slice(0, 30);
}

export async function GET(request: NextRequest) {
  const termos = termosDaBusca(request.nextUrl.searchParams.get("q") ?? "");
  if (termos.length === 0) {
    return Response.json({ notas: [], estudos: [], quadro: [], ingles: [] });
  }

  const [notas, estudos, quadro] = await Promise.all([buscarNotas(termos), buscarEstudos(termos), buscarQuadro(termos)]);
  return Response.json({ notas, estudos, quadro, ingles: buscarIngles(termos) });
}
