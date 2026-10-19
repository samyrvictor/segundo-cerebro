import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

// Cliente do Supabase com a chave secreta. Só roda no servidor e nos scripts
// locais — nunca importar em componente "use client".
export function db(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) {
    throw new Error("SUPABASE_URL/SUPABASE_SECRET_KEY não configurados. Veja frontend/.env.local.example.");
  }
  cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}

// supabase-js devolve { data, error }; isto transforma o erro em exceção.
// Para consultas que podem não achar nada (maybeSingle), use `talvez`.
export function ok<T>(resposta: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (resposta.error) throw new Error(resposta.error.message);
  return resposta.data as NonNullable<T>;
}

export function talvez<T>(resposta: { data: T; error: { message: string } | null }): NonNullable<T> | null {
  if (resposta.error) throw new Error(resposta.error.message);
  return resposta.data ?? null;
}
