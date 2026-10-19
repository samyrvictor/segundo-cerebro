import { lerBarraDeFavoritos, type PastaFavoritos } from "@/lib/bookmarks";
import { buscarConteudoDeUrl } from "@/lib/webpage";
import { mapaUrlsIngeridas, salvarPaginaFixa, salvarTextoBruto } from "@/lib/wiki";

export const runtime = "nodejs";

const SLUG = "chrome-favoritos";

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      const stats = { novas: 0, existentes: 0, falhas: 0 };

      try {
        // Online (Vercel) não existe o Chrome do seu PC pra ler.
        if (process.env.VERCEL) {
          throw new Error("Isso só funciona com o app rodando no seu PC.");
        }
        send({ type: "step", message: "Lendo a barra de favoritos do Chrome…" });
        const pastas = await lerBarraDeFavoritos();
        const urlsIngeridas = await mapaUrlsIngeridas();

        async function processarPasta(pasta: PastaFavoritos, nivel: number): Promise<string> {
          const linhas: string[] = [];

          for (const link of pasta.links) {
            const slugExistente = urlsIngeridas.get(link.url);
            if (slugExistente) {
              stats.existentes += 1;
              linhas.push(`- [[${slugExistente}]]`);
              continue;
            }

            send({ type: "step", message: `Buscando: ${link.titulo}…` });
            try {
              const conteudo = await buscarConteudoDeUrl(link.url);
              const { slug } = await salvarTextoBruto({
                texto: conteudo.texto,
                titulo: conteudo.titulo,
                url: link.url,
                plataforma: conteudo.plataforma,
              });
              urlsIngeridas.set(link.url, slug);
              stats.novas += 1;
              linhas.push(`- [[${slug}]]`);
            } catch (err) {
              stats.falhas += 1;
              const motivo = err instanceof Error ? err.message : "erro desconhecido";
              linhas.push(`- [${link.titulo}](${link.url}) _(não consegui buscar: ${motivo})_`);
            }
          }

          const subMd: string[] = [];
          for (const sub of pasta.subpastas) {
            subMd.push(await processarPasta(sub, nivel + 1));
          }

          const titulo = `${"#".repeat(Math.min(nivel, 6))} ${pasta.nome || "(sem nome)"}`;
          const partes = [titulo];
          if (linhas.length) partes.push(linhas.join("\n"));
          if (pasta.links.length === 0 && pasta.subpastas.length === 0) partes.push("_(pasta vazia)_");
          if (subMd.length) partes.push(subMd.join("\n\n"));
          return partes.join("\n\n");
        }

        const secoesMd: string[] = [];
        for (const pasta of pastas) {
          secoesMd.push(await processarPasta(pasta, 2));
        }

        const corpo = [
          "# Favoritos do Chrome",
          "",
          "Espelho da barra de favoritos do Chrome. Cada favorito vira sua",
          "própria página `tipo: fonte` com o conteúdo puro dele (link `[[assim]]`);",
          "o que não deu pra buscar fica como link externo direto.",
          "",
          secoesMd.join("\n\n"),
        ].join("\n");

        send({ type: "step", message: "Atualizando o índice de favoritos…" });
        const { slug } = await salvarPaginaFixa({
          slug: SLUG,
          titulo: "Favoritos do Chrome",
          plataforma: "chrome",
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
