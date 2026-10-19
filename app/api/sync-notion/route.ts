import { SECOES_NOTION, listarTopicos } from "@/lib/notion";
import { mapaUrlsIngeridas, salvarPaginaFixa, salvarTextoBruto } from "@/lib/wiki";

export const runtime = "nodejs";

const SLUG = "notion-ideias-e-anotacoes";

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      const stats = { novas: 0, existentes: 0, semConteudo: 0 };

      try {
        const urlsIngeridas = await mapaUrlsIngeridas();
        const secoesMd: string[] = [];

        for (const secao of SECOES_NOTION) {
          send({ type: "step", message: `Lendo "${secao.nome}"…` });
          const topicos = await listarTopicos(secao.dataSourceId);

          const linhas: string[] = [];
          for (const topico of topicos) {
            if (!topico.conteudo) {
              stats.semConteudo += 1;
              linhas.push(`- [ ] [${topico.titulo}](${topico.url})`);
              continue;
            }

            const slugExistente = urlsIngeridas.get(topico.url);
            if (slugExistente) {
              stats.existentes += 1;
              linhas.push(`- [[${slugExistente}]]`);
              continue;
            }

            send({ type: "step", message: `Trazendo: ${topico.titulo}…` });
            const { slug } = await salvarTextoBruto({
              texto: topico.conteudo,
              titulo: topico.titulo,
              url: topico.url,
              plataforma: "notion",
            });
            urlsIngeridas.set(topico.url, slug);
            stats.novas += 1;
            linhas.push(`- [[${slug}]]`);
          }

          secoesMd.push(
            [`## ${secao.nome}`, "", linhas.length ? linhas.join("\n") : "_(vazia)_"].join("\n")
          );
        }

        const corpo = [
          "# Ideias e Anotações (Notion)",
          "",
          "Índice espelhado da área **Sanc / Ideias e Anotações** do seu Notion.",
          "Tópicos com conteúdo real viram sua própria página `tipo: fonte`",
          "com o texto puro (link `[[assim]]`); os que ainda estão vazios",
          "ficam como checklist.",
          "",
          secoesMd.join("\n\n"),
        ].join("\n");

        send({ type: "step", message: "Atualizando o índice…" });
        const { slug } = await salvarPaginaFixa({
          slug: SLUG,
          titulo: "Ideias e Anotações (Notion)",
          plataforma: "notion",
          corpo,
        });

        send({ type: "done", data: { slug, ...stats } });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Erro desconhecido." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
