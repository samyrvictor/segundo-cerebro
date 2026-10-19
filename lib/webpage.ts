const MAX_CHARS = 20000;

export interface ConteudoUrl {
  titulo: string;
  texto: string;
  plataforma: string;
}

// Verifica se o texto colado é, no todo, só um link (nada de texto junto).
export function extrairUrlUnica(texto: string): string | null {
  const t = texto.trim();
  if (!t || /\s/.test(t)) return null;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:" ? t : null;
  } catch {
    return null;
  }
}

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extrairTitulo(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? decodificarEntidades(match[1]).trim() : undefined;
}

// Extração simples de texto: remove script/style/tags e normaliza espaços.
// Não tenta ser um parser de HTML completo.
function htmlParaTexto(html: string): string {
  const semTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodificarEntidades(semTags).replace(/\s+/g, " ").trim();
}

// Repositório do GitHub (raiz) — pega o README puro pela API, sem precisar
// baixar a página e limpar HTML.
async function buscarReadmeGithub(owner: string, repo: string): Promise<ConteudoUrl | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: {
      Accept: "application/vnd.github.raw+json",
      "User-Agent": "SegundoCerebro",
    },
  });
  if (!res.ok) return null;

  const texto = (await res.text()).slice(0, MAX_CHARS);
  return { titulo: `${owner}/${repo}`, texto, plataforma: "github" };
}

// Arquivo específico do GitHub (.../blob/branch/caminho) — pega o conteúdo
// puro via raw.githubusercontent.com.
async function buscarArquivoGithubRaw(url: string): Promise<ConteudoUrl | null> {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  if (!match) return null;

  const [, owner, repo, resto] = match;
  const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${resto}`);
  if (!res.ok) return null;

  const texto = (await res.text()).slice(0, MAX_CHARS);
  const nomeArquivo = resto.split("/").pop();
  return { titulo: `${owner}/${repo} — ${nomeArquivo}`, texto, plataforma: "github" };
}

// Vídeos não são baixados no servidor: vão para a fila e são transcritos no PC.
export function ehLinkDeVideo(url: string): boolean {
  const host = new URL(url).hostname.replace(/^(www\.|m\.)/, "");
  return ["youtube.com", "youtu.be", "tiktok.com", "vm.tiktok.com", "instagram.com"].includes(host);
}

// Google Docs com acesso "qualquer pessoa com o link" — exporta como texto puro.
async function buscarGoogleDoc(url: string): Promise<ConteudoUrl | null> {
  const match = url.match(/^https:\/\/docs\.google\.com\/document\/d\/([\w-]+)/);
  if (!match) return null;

  const res = await fetch(`https://docs.google.com/document/d/${match[1]}/export?format=txt`, {
    redirect: "follow",
  });
  const tipo = res.headers.get("content-type") ?? "";
  if (!res.ok || !tipo.startsWith("text/plain")) {
    throw new Error('Não consegui ler o documento. No Google Docs, deixe o acesso como "qualquer pessoa com o link".');
  }

  const texto = (await res.text()).replace(/^﻿/, "").trim().slice(0, MAX_CHARS);
  const titulo = texto.split("\n").find((l) => l.trim())?.trim().slice(0, 80) || "Google Docs";
  return { titulo, texto, plataforma: "google docs" };
}

export async function buscarConteudoDeUrl(url: string): Promise<ConteudoUrl> {
  const doc = await buscarGoogleDoc(url);
  if (doc) return doc;

  const repoRaiz = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
  if (repoRaiz) {
    const [, owner, repo] = repoRaiz;
    const readme = await buscarReadmeGithub(owner, repo);
    if (readme) return readme;
  }

  const arquivo = await buscarArquivoGithubRaw(url);
  if (arquivo) return arquivo;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SegundoCerebro/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Não consegui abrir a página (HTTP ${res.status}).`);
  }

  const html = await res.text();
  const texto = htmlParaTexto(html).slice(0, MAX_CHARS);
  if (!texto) {
    throw new Error("A página não tem texto legível.");
  }

  return {
    titulo: extrairTitulo(html) ?? url,
    texto,
    plataforma: new URL(url).hostname.replace(/^www\./, ""),
  };
}
