import { NextRequest } from "next/server";
import { lerDiasFeitos, marcarDia } from "@/lib/ingles/progresso";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ feitos: await lerDiasFeitos() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { id, feito } = body ?? {};

  if (typeof id !== "string" || !/^S\d{2}D[1-7]$/.test(id) || typeof feito !== "boolean") {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  await marcarDia(id, feito);
  return Response.json({ ok: true });
}
