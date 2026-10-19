import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSAO, UM_ANO, senhaCorreta, tokenDaSessao } from "@/lib/sessao";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const senha = typeof body?.senha === "string" ? body.senha : "";

  if (!(await senhaCorreta(senha))) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_SESSAO, await tokenDaSessao(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: UM_ANO,
    path: "/",
  });
  return resposta;
}
