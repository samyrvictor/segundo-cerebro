// Login de um usuário só: o cookie guarda um HMAC da senha (APP_SENHA) feito
// com a chave secreta do Supabase. Sem a chave não dá pra forjar o cookie, e
// trocar a senha derruba todas as sessões antigas.

export const COOKIE_SESSAO = "sessao";
export const UM_ANO = 60 * 60 * 24 * 365;

async function hmac(chave: string, mensagem: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(chave), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const assinatura = await crypto.subtle.sign("HMAC", k, enc.encode(mensagem));
  return Array.from(new Uint8Array(assinatura), (b) => b.toString(16).padStart(2, "0")).join("");
}

function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

function configuracao() {
  const senha = process.env.APP_SENHA;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!senha || !chave) throw new Error("APP_SENHA/SUPABASE_SECRET_KEY não configurados.");
  return { senha, chave };
}

export async function tokenDaSessao(): Promise<string> {
  const { senha, chave } = configuracao();
  return hmac(chave, `segundo-cerebro:${senha}`);
}

export async function sessaoValida(cookie: string | undefined): Promise<boolean> {
  return Boolean(cookie) && iguais(cookie!, await tokenDaSessao());
}

// Compara a senha digitada via HMAC (tempo constante, sem vazar o tamanho).
export async function senhaCorreta(tentativa: string): Promise<boolean> {
  const { senha, chave } = configuracao();
  return iguais(await hmac(chave, tentativa), await hmac(chave, senha));
}
