import { db, ok, talvez } from "./db";

// Token salvo na tabela `config` (o app online não tem disco persistente).
const CHAVE = "notion_oauth";

const REDIRECT_URI =
  process.env.NOTION_OAUTH_REDIRECT_URI ?? "http://localhost:3000/api/notion/oauth/callback";

interface NotionOAuthToken {
  access_token: string;
  workspace_name?: string;
  bot_id?: string;
}

function getCredenciais() {
  const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "NOTION_OAUTH_CLIENT_ID/NOTION_OAUTH_CLIENT_SECRET não configurados. Veja frontend/.env.local.example."
    );
  }
  return { clientId, clientSecret };
}

export function montarUrlAutorizacao(): string {
  const { clientId } = getCredenciais();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: REDIRECT_URI,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

export async function trocarCodigoPorToken(code: string): Promise<void> {
  const { clientId, clientSecret } = getCredenciais();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Notion recusou a troca do código: ${texto}`);
  }

  const dados = (await res.json()) as NotionOAuthToken;
  ok(await db().from("config").upsert({ chave: CHAVE, valor: dados }));
}

export async function lerTokenSalvo(): Promise<NotionOAuthToken | null> {
  const linha = talvez(await db().from("config").select("valor").eq("chave", CHAVE).maybeSingle());
  return (linha?.valor as NotionOAuthToken | undefined) ?? null;
}

export async function desconectar(): Promise<void> {
  ok(await db().from("config").delete().eq("chave", CHAVE));
}
