import { NextRequest } from "next/server";
import { db, ok } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const videos = ok(
    await db()
      .from("videos")
      .select("id, url, assunto, status, erro, slug, criado_em")
      .order("criado_em", { ascending: false })
      .limit(100)
  );
  return Response.json({ videos });
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "id inválido." }, { status: 400 });
  }
  ok(await db().from("videos").delete().eq("id", id));
  return Response.json({ ok: true });
}
