import { Client } from "@notionhq/client";
import { lerTokenSalvo } from "./notionOAuth";

// IDs fixos da área "Sanc / Ideias e Anotações" deste workspace do Notion —
// ver CLAUDE.md. Se a estrutura lá mudar, esses ids precisam ser atualizados.
export const SECOES_NOTION = [
  { nome: "Ideias (3) — estudo técnico", dataSourceId: "2a688957-aa48-81b7-aee7-000b19ef6f3b" },
  { nome: "Ideias (7) — idiomas", dataSourceId: "28a88957-aa48-8179-89cd-000b006fc3cf" },
  { nome: "Ideias (8)", dataSourceId: "30f88957-aa48-8140-9165-000b582d5802" },
  { nome: "Ideias (11) — diversos", dataSourceId: "32488957-aa48-8100-920c-000be4ca545f" },
] as const;

export interface TopicoNotion {
  titulo: string;
  url: string;
  conteudo: string;
}

// Prefere o token obtido via "Conectar com Notion" (OAuth); cai para
// NOTION_API_KEY (integração manual) se não tiver conectado por OAuth.
async function getClient(): Promise<Client> {
  const oauth = await lerTokenSalvo();
  if (oauth?.access_token) {
    return new Client({ auth: oauth.access_token });
  }

  const apiKey = process.env.NOTION_API_KEY;
  if (apiKey) {
    return new Client({ auth: apiKey });
  }

  throw new Error(
    'Notion não conectado. Clique em "Conectar com Notion" na página Notion do app.'
  );
}

function textoDeRichText(richText: { plain_text: string }[] = []): string {
  return richText.map((t) => t.plain_text).join("");
}

// Extrai o texto legível de um bloco (parágrafo, título, lista, callout...).
// Blocos sem rich_text (imagem, divisor etc.) viram string vazia.
function textoDoBloco(block: Record<string, unknown>): string {
  const tipo = block.type as string;
  const conteudo = block[tipo] as { rich_text?: { plain_text: string }[] } | undefined;
  if (!conteudo?.rich_text) return "";

  const texto = textoDeRichText(conteudo.rich_text).trim();
  if (!texto) return "";
  if (tipo === "bulleted_list_item" || tipo === "numbered_list_item") return `- ${texto}`;
  return texto;
}

async function lerConteudoDaPagina(client: Client, pageId: string): Promise<string> {
  const linhas: string[] = [];
  let cursor: string | undefined;

  do {
    const res = await client.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const block of res.results as Record<string, unknown>[]) {
      const texto = textoDoBloco(block);
      // "Descrição:" é o cabeçalho-modelo da página, não conteúdo real.
      if (texto && texto !== "Descrição:") linhas.push(texto);
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return linhas.join("\n\n");
}

export async function listarTopicos(dataSourceId: string): Promise<TopicoNotion[]> {
  const client = await getClient();
  const paginas: { id: string; url: string; properties: Record<string, unknown> }[] = [];
  let cursor: string | undefined;

  do {
    const res = await client.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
    });
    paginas.push(
      ...(res.results as unknown as { id: string; url: string; properties: Record<string, unknown> }[])
    );
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  const topicos: TopicoNotion[] = [];
  for (const pagina of paginas) {
    const nomeProp = pagina.properties?.["Nome"] as
      | { title?: { plain_text: string }[] }
      | undefined;
    const titulo = textoDeRichText(nomeProp?.title ?? []) || "(sem título)";
    const conteudo = await lerConteudoDaPagina(client, pagina.id);
    topicos.push({ titulo, url: pagina.url, conteudo });
  }

  return topicos;
}
