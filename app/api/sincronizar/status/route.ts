import { db, talvez } from "@/lib/db";
import { lerTokenSalvo } from "@/lib/notionOAuth";

export const runtime = "nodejs";

async function dataDaPagina(slug: string): Promise<string | null> {
  const linha = talvez(await db().from("fontes").select("data_ingestao").eq("slug", slug).maybeSingle());
  return (linha?.data_ingestao as string | undefined) ?? null;
}

export async function GET() {
  const obsidian = talvez(await db().from("config").select("valor").eq("chave", "ultima_sync_obsidian").maybeSingle());
  const notion = await lerTokenSalvo();

  return Response.json({
    obsidian: (obsidian?.valor as string | undefined) ?? null,
    notion: {
      conectado: Boolean(notion?.access_token),
      workspace: notion?.workspace_name ?? null,
      ultima: await dataDaPagina("notion-ideias-e-anotacoes"),
    },
    chrome: { ultima: await dataDaPagina("chrome-favoritos"), disponivel: !process.env.VERCEL },
  });
}
