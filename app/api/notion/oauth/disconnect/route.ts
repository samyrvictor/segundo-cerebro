import { desconectar } from "@/lib/notionOAuth";

export const runtime = "nodejs";

export async function POST() {
  await desconectar();
  return Response.json({ ok: true });
}
