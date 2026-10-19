import { db, ok } from "../db";

export async function lerDiasFeitos(): Promise<string[]> {
  const linhas = ok(await db().from("ingles_feitos").select("id"));
  return linhas.map((l) => l.id as string);
}

export async function marcarDia(id: string, feito: boolean): Promise<void> {
  if (feito) {
    ok(await db().from("ingles_feitos").upsert({ id }));
  } else {
    ok(await db().from("ingles_feitos").delete().eq("id", id));
  }
}
