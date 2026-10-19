import { NextRequest } from "next/server";
import { areaValida, colunaValida } from "@/lib/quadro";
import { apagarTarefa, atualizarTarefa, criarTarefa, listarTarefas } from "@/lib/tarefas";

export const runtime = "nodejs";

const tituloValido = (t: unknown): t is string => typeof t === "string" && t.trim().length > 0 && t.trim().length <= 200;

export async function GET() {
  return Response.json({ tarefas: await listarTarefas() });
}

export async function POST(request: NextRequest) {
  const { titulo, area, coluna } = (await request.json().catch(() => null)) ?? {};
  if (!tituloValido(titulo) || (area != null && !areaValida(area)) || (coluna != null && !colunaValida(coluna))) {
    return Response.json({ error: "Dê um título ao cartão." }, { status: 400 });
  }
  await criarTarefa(titulo.trim(), area ?? null, coluna ?? "a_fazer");
  return Response.json({ tarefas: await listarTarefas() });
}

export async function PATCH(request: NextRequest) {
  const { id, titulo, coluna, area, ordem } = (await request.json().catch(() => null)) ?? {};
  const invalido =
    !Number.isInteger(id) ||
    (titulo !== undefined && !tituloValido(titulo)) ||
    (coluna !== undefined && !colunaValida(coluna)) ||
    (area !== undefined && area !== null && !areaValida(area)) ||
    (ordem !== undefined && typeof ordem !== "number");
  if (invalido) return Response.json({ error: "Dados inválidos." }, { status: 400 });

  await atualizarTarefa(id, {
    ...(titulo !== undefined && { titulo: titulo.trim() }),
    ...(coluna !== undefined && { coluna }),
    ...(area !== undefined && { area }),
    ...(ordem !== undefined && { ordem }),
  });
  return Response.json({ tarefas: await listarTarefas() });
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "id inválido." }, { status: 400 });
  await apagarTarefa(id);
  return Response.json({ tarefas: await listarTarefas() });
}
