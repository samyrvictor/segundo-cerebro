import { NextRequest } from "next/server";
import { db, ok } from "@/lib/db";
import { buscarConteudoDeUrl, ehLinkDeVideo, extrairUrlUnica } from "@/lib/webpage";
import { salvarTextoBruto } from "@/lib/wiki";
import { idDoYoutube, legendaDoYoutube } from "@/lib/youtube";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const texto = body?.texto;
  const assunto = typeof body?.assunto === "string" && body.assunto ? body.assunto : undefined;

  if (typeof texto !== "string" || !texto.trim()) {
    return Response.json({ error: "Cole algum texto antes de enviar." }, { status: 400 });
  }

  const url = extrairUrlUnica(texto);

  try {
    if (url && ehLinkDeVideo(url)) {
      // YouTube: tenta a legenda na hora (sem PC). Se der, já vira nota.
      const idYoutube = idDoYoutube(url);
      if (idYoutube) {
        try {
          const { titulo, texto: transcricao } = await legendaDoYoutube(idYoutube);
          const { slug } = await salvarTextoBruto({ texto: transcricao, titulo, url, plataforma: "youtube", assunto });
          ok(await db().from("videos").insert({ url, assunto: assunto ?? null, status: "feito", slug }));
          return Response.json({ slug });
        } catch (err) {
          // Bloqueado ou sem legenda: segue para a fila do PC, como TikTok/Instagram.
          console.warn(`[youtube] ${idYoutube}: ${err instanceof Error ? err.message : err}`);
        }
      }
      const video = ok(await db().from("videos").insert({ url, assunto: assunto ?? null }).select("id").single());
      return Response.json({ fila: true, id: video.id });
    }

    let resultado;
    if (url) {
      const conteudo = await buscarConteudoDeUrl(url);
      resultado = await salvarTextoBruto({
        texto: conteudo.texto,
        titulo: conteudo.titulo,
        url,
        plataforma: conteudo.plataforma,
        assunto,
      });
    } else {
      resultado = await salvarTextoBruto({ texto, assunto });
    }

    return Response.json({ slug: resultado.slug });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}
