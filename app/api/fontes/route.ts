import { NextRequest } from "next/server";
import { db, ok } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limite = Number(request.nextUrl.searchParams.get("limit")) || 12;

  const fontes = ok(
    await db()
      .from("fontes")
      .select("slug, titulo, plataforma, data_ingestao, tags, assunto")
      .order("data_ingestao", { ascending: false })
      .order("atualizado_em", { ascending: false })
      .limit(limite)
  );

  return Response.json({ fontes });
}
