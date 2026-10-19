// Sincroniza o banco (Supabase) com a pasta do Obsidian (segundo-celebro/),
// nos dois sentidos, arquivo a arquivo. Uso (dentro de frontend/):
//   npm run sincronizar                 — rodada normal (o agendador chama esta)
//   npm run sincronizar -- --importar   — primeira vez: o vault vence (migração)
// Regra de decisão em scripts/decidir.ts; formatos dos arquivos em lib/vault.ts.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

process.loadEnvFile(path.resolve(import.meta.dirname, "..", ".env.local"));

import { isoLocal } from "@/lib/datas";
import { db, ok } from "@/lib/db";
import { gerarMarkdown } from "@/lib/ingles/plano";
import { WIKI_ROOT } from "@/lib/paths";
import { lerEstudos, lerSemana } from "@/lib/rotina";
import { listarTarefas } from "@/lib/tarefas";
import { slugify } from "@/lib/slug";
import {
  metadadosDaNota,
  parseDiario,
  parseEstudos,
  parseIngles,
  parseLog,
  parseQuadro,
  parseSemana,
  renderDiario,
  renderEstudos,
  renderIndex,
  renderLog,
  renderQuadro,
  renderSemana,
} from "@/lib/vault";
import { decidir } from "./decidir";

const ESTADO_PATH = path.resolve(import.meta.dirname, "..", ".sync-estado.json");
const IMPORTAR = process.argv.includes("--importar");
const HOJE = isoLocal(new Date());

type Estado = Record<string, { local: string; banco: string }>;

interface Documento {
  caminho: string; // relativo ao vault, com "/"
  banco: string | null; // conteúdo que o banco geraria para este arquivo
  enviar(conteudo: string): Promise<string | null>; // arquivo → banco; devolve o novo `banco`
  apagarBanco(): Promise<void>;
  fixo?: boolean; // arquivos de rotina que sempre existem: apagar = gerar de novo
}

const hash = (conteudo: string | null) =>
  conteudo === null ? "" : crypto.createHash("sha1").update(conteudo).digest("hex");

const absoluto = (caminho: string) => path.join(WIKI_ROOT, ...caminho.split("/"));

async function ler(caminho: string): Promise<string | null> {
  try {
    return await fs.readFile(absoluto(caminho), "utf-8");
  } catch {
    return null;
  }
}

async function escrever(caminho: string, conteudo: string) {
  await fs.mkdir(path.dirname(absoluto(caminho)), { recursive: true });
  await fs.writeFile(absoluto(caminho), conteudo, "utf-8");
}

// Só mexe dentro de wiki/ e rotina/ (e index.md/log.md, gerados no fim).
function caminhoPermitido(caminho: string) {
  return /^(wiki|rotina)\/[^]*\.md$/.test(caminho) && !caminho.split("/").includes("..");
}

async function listarMd(pasta: string): Promise<string[]> {
  try {
    const itens = await fs.readdir(absoluto(pasta), { recursive: true });
    return itens
      .map((i) => `${pasta}/${i.split(path.sep).join("/")}`)
      .filter((c) => c.endsWith(".md") && !c.split("/").some((p) => p.startsWith(".")));
  } catch {
    return [];
  }
}

async function caminhoDeConflito(caminho: string): Promise<string> {
  const base = caminho.replace(/\.md$/, "");
  for (let n = 1; ; n++) {
    const candidato = `${base} (conflito ${HOJE}${n > 1 ? ` ${n}` : ""}).md`;
    if ((await ler(candidato)) === null) return candidato;
  }
}

// --- Documentos -------------------------------------------------------------

async function documentosDeNotas(): Promise<Documento[]> {
  const linhas = ok(await db().from("fontes").select("slug, caminho, markdown"));
  const porCaminho = new Map(linhas.map((l) => [l.caminho as string, l]));
  const slugsUsados = new Set(linhas.map((l) => l.slug as string));
  const caminhos = new Set([...porCaminho.keys(), ...(await listarMd("wiki"))]);

  function novoSlug(caminho: string) {
    const nome = path.posix.basename(caminho, ".md");
    const base = /^[a-z0-9-]+$/.test(nome) ? nome : slugify(nome);
    let slug = base;
    for (let n = 2; slugsUsados.has(slug); n++) slug = `${base}-${n}`;
    slugsUsados.add(slug);
    return slug;
  }

  return [...caminhos].map((caminho) => ({
    caminho,
    banco: (porCaminho.get(caminho)?.markdown as string | undefined) ?? null,
    async enviar(conteudo) {
      const meta = metadadosDaNota(caminho, conteudo, HOJE);
      const colunas = {
        titulo: meta.titulo,
        plataforma: meta.plataforma,
        url: meta.url,
        assunto: meta.assunto,
        tags: meta.tags,
        data_ingestao: meta.data_ingestao,
        markdown: conteudo,
        atualizado_em: new Date().toISOString(),
      };
      if (porCaminho.has(caminho)) {
        ok(await db().from("fontes").update(colunas).eq("caminho", caminho));
      } else {
        ok(await db().from("fontes").insert({ ...colunas, slug: novoSlug(caminho), caminho }));
        if (!IMPORTAR) ok(await db().from("log").insert({ data: HOJE, acao: "ingest", titulo: meta.titulo }));
      }
      return conteudo;
    },
    async apagarBanco() {
      const titulo = metadadosDaNota(caminho, porCaminho.get(caminho)?.markdown ?? "", HOJE).titulo;
      ok(await db().from("fontes").delete().eq("caminho", caminho));
      ok(await db().from("log").insert({ data: HOJE, acao: "apagado", titulo }));
    },
  }));
}

async function documentosDoDiario(): Promise<Documento[]> {
  const linhas = ok(await db().from("itens_dia").select("data, texto, feito").order("ordem"));
  const porData = new Map<string, { texto: string; feito: boolean }[]>();
  for (const { data, texto, feito } of linhas) porData.set(data, [...(porData.get(data) ?? []), { texto, feito }]);

  const locais = (await listarMd("rotina/diario"))
    .map((c) => path.posix.basename(c, ".md"))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const datas = new Set([...porData.keys(), ...locais]);

  return [...datas].map((data) => {
    const gravar = async (itens: { texto: string; feito: boolean }[]) => {
      ok(await db().from("itens_dia").delete().eq("data", data));
      if (itens.length) {
        ok(await db().from("itens_dia").insert(itens.map((it, i) => ({ data, texto: it.texto, feito: it.feito, ordem: i + 1 }))));
      }
      return itens.length ? renderDiario(data, itens) : null;
    };
    return {
      caminho: `rotina/diario/${data}.md`,
      banco: porData.has(data) ? renderDiario(data, porData.get(data)!) : null,
      enviar: (conteudo) => gravar(parseDiario(conteudo)),
      apagarBanco: async () => {
        await gravar([]);
      },
    };
  });
}

async function documentosFixos(): Promise<Documento[]> {
  const ingles = new Set(ok(await db().from("ingles_feitos").select("id")).map((l) => l.id as string));
  const estudos = await lerEstudos();
  const semana = await lerSemana();
  const quadro = await listarTarefas();
  const nada = async () => {};

  return [
    {
      caminho: "rotina/ingles.md",
      banco: gerarMarkdown(ingles),
      fixo: true,
      apagarBanco: nada,
      async enviar(conteudo) {
        const feitos = new Set(parseIngles(conteudo));
        ok(await db().from("ingles_feitos").delete().not("id", "in", `(${[...feitos, "_"].join(",")})`));
        if (feitos.size) ok(await db().from("ingles_feitos").upsert([...feitos].map((id) => ({ id }))));
        return gerarMarkdown(feitos);
      },
    },
    {
      caminho: "rotina/estudos.md",
      banco: estudos.length ? renderEstudos(estudos) : null,
      fixo: true,
      apagarBanco: nada,
      async enviar(conteudo) {
        const secoes = parseEstudos(conteudo);
        ok(await db().from("estudos").delete().gte("id", 0));
        const linhas = secoes.flatMap((s) => s.topicos.map((t) => ({ secao: s.nome, topico: t.texto, feito: t.feito })));
        const unicas = linhas.filter((l, i) => linhas.findIndex((x) => x.topico === l.topico) === i);
        if (unicas.length) ok(await db().from("estudos").insert(unicas));
        const novo = await lerEstudos();
        return novo.length ? renderEstudos(novo) : null;
      },
    },
    {
      caminho: "rotina/semana.md",
      banco: semana.length > 1 ? renderSemana(semana) : null,
      fixo: true,
      apagarBanco: nada,
      async enviar(conteudo) {
        const [, ...corpo] = parseSemana(conteudo);
        ok(await db().from("semana").delete().gte("ordem", 0));
        const linhas = corpo.map((c, ordem) => ({ ordem, dia: c[0] ?? "", manha: c[1] ?? "—", noite: c[2] ?? "—" }));
        if (linhas.length) ok(await db().from("semana").insert(linhas));
        const nova = await lerSemana();
        return nova.length > 1 ? renderSemana(nova) : null;
      },
    },
    {
      caminho: "rotina/quadro.md",
      banco: renderQuadro(quadro),
      fixo: true,
      apagarBanco: nada,
      async enviar(conteudo) {
        // Recria o quadro a partir do arquivo, mantendo as datas dos cartões que já existiam.
        const antigos = ok(await db().from("tarefas").select("titulo, criado_em, concluido_em"));
        const cartoes = parseQuadro(conteudo);
        ok(await db().from("tarefas").delete().gte("id", 0));
        if (cartoes.length) {
          ok(
            await db()
              .from("tarefas")
              .insert(
                cartoes.map((c, i) => {
                  const antigo = antigos.find((a) => a.titulo === c.titulo);
                  return {
                    ...c,
                    ordem: i + 1,
                    criado_em: antigo?.criado_em ?? new Date().toISOString(),
                    concluido_em: c.coluna === "feito" ? (antigo?.concluido_em ?? new Date().toISOString()) : null,
                  };
                })
              )
          );
        }
        return renderQuadro(await listarTarefas());
      },
    },
  ];
}

// --- index.md e log.md (só banco → vault) ----------------------------------

async function gerarIndiceELog() {
  if (IMPORTAR) {
    const { count } = await db().from("log").select("id", { count: "exact", head: true });
    const logLocal = await fs.readFile(path.join(WIKI_ROOT, "log.md"), "utf-8").catch(() => "");
    const entradas = parseLog(logLocal);
    if (!count && entradas.length) ok(await db().from("log").insert(entradas));
  }

  const fontes = ok(
    await db()
      .from("fontes")
      .select("caminho, titulo, markdown")
      .order("data_ingestao", { ascending: false })
      .order("caminho")
  );
  const indice = renderIndex(
    fontes.map((f) => ({
      caminho: f.caminho,
      titulo: f.titulo,
      tipo: metadadosDaNota(f.caminho, f.markdown, HOJE).tipo,
    }))
  );
  const log = renderLog(ok(await db().from("log").select("data, acao, titulo").order("id")));

  for (const [arquivo, conteudo] of [
    ["index.md", indice],
    ["log.md", log],
  ]) {
    const destino = path.join(WIKI_ROOT, arquivo);
    const atual = await fs.readFile(destino, "utf-8").catch(() => null);
    if (atual !== conteudo) {
      await fs.writeFile(destino, conteudo, "utf-8");
      console.log(`↓ ${arquivo}`);
    }
  }
}

// --- Rodada -----------------------------------------------------------------

async function main() {
  const estado: Estado = JSON.parse(await fs.readFile(ESTADO_PATH, "utf-8").catch(() => "{}")).arquivos ?? {};
  const contagem: Record<string, number> = {};

  // Lê tudo do banco antes de escrever qualquer coisa: se a rede cair aqui, nada muda.
  const documentos = [...(await documentosDeNotas()), ...(await documentosDoDiario()), ...(await documentosFixos())];

  try {
    for (const doc of documentos) {
      if (!caminhoPermitido(doc.caminho)) continue;
      const local = await ler(doc.caminho);
      let acao = decidir({ estado: estado[doc.caminho], local: hash(local), banco: hash(doc.banco), importar: IMPORTAR });
      if (acao === "apagarBanco" && doc.fixo) acao = "baixar";
      contagem[acao] = (contagem[acao] ?? 0) + 1;

      switch (acao) {
        case "nada":
          break;
        case "registrar":
          estado[doc.caminho] = { local: hash(local), banco: hash(doc.banco) };
          break;
        case "enviar": {
          const novoBanco = await doc.enviar(local!);
          estado[doc.caminho] = { local: hash(local), banco: hash(novoBanco) };
          console.log(`↑ ${doc.caminho}`);
          break;
        }
        case "conflito": {
          const copia = await caminhoDeConflito(doc.caminho);
          await escrever(copia, local!);
          console.log(`⚠ conflito em ${doc.caminho} — sua versão do Obsidian ficou em ${copia}`);
        }
        // fallthrough: depois de guardar a cópia, o banco vence
        case "baixar":
          if (doc.banco === null) {
            await fs.rm(absoluto(doc.caminho), { force: true });
            delete estado[doc.caminho];
          } else {
            await escrever(doc.caminho, doc.banco);
            estado[doc.caminho] = { local: hash(doc.banco), banco: hash(doc.banco) };
          }
          console.log(`↓ ${doc.caminho}`);
          break;
        case "apagarLocal":
          await fs.rm(absoluto(doc.caminho), { force: true });
          delete estado[doc.caminho];
          console.log(`✕ ${doc.caminho} (apagado no app)`);
          break;
        case "apagarBanco":
          await doc.apagarBanco();
          delete estado[doc.caminho];
          console.log(`✕ ${doc.caminho} (apagado no Obsidian)`);
          break;
        case "esquecer":
          delete estado[doc.caminho];
          break;
      }
    }

    await gerarIndiceELog();
    // A aba Sincronizar do app mostra quando o Obsidian foi atualizado pela última vez.
    ok(await db().from("config").upsert({ chave: "ultima_sync_obsidian", valor: new Date().toISOString() }));
  } finally {
    // Salva o que já foi feito mesmo se algo falhar no meio.
    await fs.writeFile(ESTADO_PATH, JSON.stringify({ arquivos: estado }, null, 2), "utf-8");
  }

  const resumo = Object.entries(contagem)
    .map(([acao, n]) => `${acao}: ${n}`)
    .join(" · ");
  console.log(`[${new Date().toLocaleString("pt-BR")}] sincronizado — ${resumo || "nada a fazer"}`);
}

main().catch((err) => {
  console.error(`[${new Date().toLocaleString("pt-BR")}] erro: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
