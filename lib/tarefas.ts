import { db, ok, talvez } from "./db";
import type { Area, Coluna, Tarefa } from "./quadro";

// Quadro (kanban) do dia a dia — leitura e escrita no banco.

export async function listarTarefas(): Promise<Tarefa[]> {
  return ok(await db().from("tarefas").select("id, titulo, coluna, area, ordem").order("ordem"));
}

// Cartão novo entra no fim da coluna.
export async function criarTarefa(titulo: string, area: Area | null, coluna: Coluna = "a_fazer"): Promise<void> {
  const ultimo = talvez(
    await db().from("tarefas").select("ordem").eq("coluna", coluna).order("ordem", { ascending: false }).limit(1).maybeSingle()
  );
  ok(await db().from("tarefas").insert({ titulo, area, coluna, ordem: (ultimo?.ordem ?? 0) + 1 }));
}

export async function atualizarTarefa(
  id: number,
  mudancas: Partial<Pick<Tarefa, "titulo" | "coluna" | "area" | "ordem">>
): Promise<void> {
  const extra = mudancas.coluna ? { concluido_em: mudancas.coluna === "feito" ? new Date().toISOString() : null } : {};
  ok(await db().from("tarefas").update({ ...mudancas, ...extra }).eq("id", id));
}

export async function apagarTarefa(id: number): Promise<void> {
  ok(await db().from("tarefas").delete().eq("id", id));
}
