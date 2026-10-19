import { NextRequest } from "next/server";
import { lerAno } from "@/lib/rotina";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ano = Number(request.nextUrl.searchParams.get("ano")) || new Date().getFullYear();
  return Response.json({ dias: await lerAno(ano) });
}
