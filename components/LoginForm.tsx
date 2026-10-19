"use client";

import { useState } from "react";

export function LoginForm({ destino }: { destino: string }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    }).catch(() => null);

    if (res?.ok) {
      // Recarrega de verdade para o proxy já ver o cookie novo.
      window.location.assign(destino);
      return;
    }
    const data = await res?.json().catch(() => null);
    setErro(data?.error ?? "Não consegui entrar. Tente de novo.");
    setEntrando(false);
  }

  return (
    <form onSubmit={entrar} className="mt-6 flex flex-col gap-3">
      <input
        type="password"
        autoFocus
        autoComplete="current-password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className="painel px-4 py-3 text-sm outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary"
      />
      <button
        type="submit"
        disabled={entrando || !senha}
        className="botao"
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>
      {erro && <p className="text-sm text-danger">{erro}</p>}
    </form>
  );
}
