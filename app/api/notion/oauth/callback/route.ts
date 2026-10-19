import { NextRequest } from "next/server";
import { trocarCodigoPorToken } from "@/lib/notionOAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const erroNotion = request.nextUrl.searchParams.get("error");

  if (erroNotion) {
    return Response.redirect(new URL(`/sincronizar?erro=${encodeURIComponent(erroNotion)}`, request.url));
  }
  if (!code) {
    return Response.redirect(new URL("/sincronizar?erro=sem_codigo", request.url));
  }

  try {
    await trocarCodigoPorToken(code);
    return Response.redirect(new URL("/sincronizar?conectado=1", request.url));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return Response.redirect(new URL(`/sincronizar?erro=${encodeURIComponent(msg)}`, request.url));
  }
}
