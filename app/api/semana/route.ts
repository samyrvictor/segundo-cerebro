import { NextRequest } from "next/server";
import { salvarCelulaSemana } from "@/lib/rotina";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const { ordem, campo, valor } = (await request.json().catch(() => null)) ?? {};
  if (!Number.isInteger(ordem) || (campo !== "manha" && campo !== "noite") || typeof valor !== "string" || valor.length > 200) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }
  await salvarCelulaSemana(ordem, campo, valor);
  return Response.json({ ok: true });
}
