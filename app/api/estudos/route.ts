import { NextRequest } from "next/server";
import { adicionarEstudo, lerEstudos, marcarEstudo, removerEstudo } from "@/lib/rotina";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ secoes: await lerEstudos() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  try {
    if (body?.acao === "marcar" && typeof body.topico === "string" && typeof body.feito === "boolean") {
      await marcarEstudo(body.topico, body.feito);
    } else if (
      body?.acao === "adicionar" &&
      typeof body.secao === "string" &&
      typeof body.topico === "string" &&
      body.topico.trim()
    ) {
      await adicionarEstudo(body.secao, body.topico.trim());
    } else if (body?.acao === "remover" && typeof body.topico === "string") {
      await removerEstudo(body.topico);
    } else {
      return Response.json({ error: "Dados inválidos." }, { status: 400 });
    }
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 500 }
    );
  }

  return Response.json({ secoes: await lerEstudos() });
}
