import { db, ok } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Chamado 1x por dia pelo Cron da Vercel (vercel.json): uma consulta mínima
// para o Supabase Free não pausar o projeto por 7 dias sem uso. Fica fora do
// login de propósito — só responde "ok", sem nenhum dado.
export async function GET() {
  ok(await db().from("log").select("id", { count: "exact", head: true }));
  return Response.json({ ok: true });
}
