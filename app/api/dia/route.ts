import { NextRequest } from "next/server";
import { adicionarItemDia, dataValida, lerDia, marcarItemDia, removerItemDia, sugestoesItens } from "@/lib/rotina";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get("data");
  if (!dataValida(data)) return Response.json({ error: "Data inválida." }, { status: 400 });
  const [itens, sugestoes] = await Promise.all([lerDia(data), sugestoesItens()]);
  return Response.json({ itens, sugestoes });
}

export async function POST(request: NextRequest) {
  const { data, texto } = (await request.json().catch(() => null)) ?? {};
  if (!dataValida(data) || typeof texto !== "string" || !texto.trim() || texto.trim().length > 120) {
    return Response.json({ error: "Escreva o que você precisa fazer (até 120 letras)." }, { status: 400 });
  }
  const item = await adicionarItemDia(data, texto.trim());
  return Response.json({ item });
}

export async function PATCH(request: NextRequest) {
  const { id, feito } = (await request.json().catch(() => null)) ?? {};
  if (!Number.isInteger(id) || typeof feito !== "boolean") return Response.json({ error: "Dados inválidos." }, { status: 400 });
  await marcarItemDia(id, feito);
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "id inválido." }, { status: 400 });
  await removerItemDia(id);
  return Response.json({ ok: true });
}
