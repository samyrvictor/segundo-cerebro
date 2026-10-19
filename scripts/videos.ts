// Fila de vídeos: o app online só guarda o link; a transcrição é feita aqui
// no PC pelo Claude Code (skill /watch). Uso (dentro de frontend/):
//   npm run videos -- listar
//   npm run videos -- concluir <id> <arquivo-da-transcricao> [titulo]
//   npm run videos -- erro <id> "<motivo>"

import fs from "node:fs/promises";
import path from "node:path";

process.loadEnvFile(path.resolve(import.meta.dirname, "..", ".env.local"));

import { db, ok } from "@/lib/db";
import { salvarTextoBruto } from "@/lib/wiki";

async function main() {
  const [comando, id, ...resto] = process.argv.slice(2);

  if (comando === "listar") {
    const pendentes = ok(
      await db().from("videos").select("id, url, assunto").eq("status", "pendente").order("id")
    );
    console.log(JSON.stringify(pendentes, null, 2));
    return;
  }

  if (comando === "concluir" && id && resto[0]) {
    const video = ok(await db().from("videos").select("url, assunto").eq("id", id).single());
    const transcricao = await fs.readFile(resto[0], "utf-8");
    const { slug } = await salvarTextoBruto({
      texto: transcricao,
      titulo: resto[1] ?? video.url,
      url: video.url,
      plataforma: new URL(video.url).hostname.replace(/^(www\.|m\.)/, ""),
      assunto: video.assunto ?? undefined,
    });
    ok(await db().from("videos").update({ status: "feito", slug, erro: null }).eq("id", id));
    console.log(slug);
    return;
  }

  if (comando === "erro" && id && resto[0]) {
    ok(await db().from("videos").update({ status: "erro", erro: resto[0] }).eq("id", id));
    console.log(`vídeo ${id} marcado com erro`);
    return;
  }

  console.error('Uso: listar | concluir <id> <arquivo> [titulo] | erro <id> "<motivo>"');
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
