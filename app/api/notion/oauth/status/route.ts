import { lerTokenSalvo } from "@/lib/notionOAuth";

export const runtime = "nodejs";

export async function GET() {
  const token = await lerTokenSalvo();
  return Response.json({
    conectado: Boolean(token?.access_token),
    workspace: token?.workspace_name ?? null,
  });
}
