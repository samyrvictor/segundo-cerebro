import { montarUrlAutorizacao } from "@/lib/notionOAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.redirect(montarUrlAutorizacao());
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
