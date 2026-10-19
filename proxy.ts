import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, sessaoValida } from "@/lib/sessao";

// Tudo exige login, menos a tela de login e o "manter ativo" do cron diário.
export async function proxy(request: NextRequest) {
  if (await sessaoValida(request.cookies.get(COOKIE_SESSAO)?.value)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("volta", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|api/login|api/manter-ativo|_next/static|_next/image|favicon.ico|icon|apple-icon).*)"],
};
