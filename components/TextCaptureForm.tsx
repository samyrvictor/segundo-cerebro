"use client";

import Link from "next/link";
import { useState } from "react";
import { ASSUNTOS } from "@/lib/assuntos";

type Status = "idle" | "running" | "done" | "error";

export function TextCaptureForm({ aoSalvar }: { aoSalvar?: () => void } = {}) {
  const [texto, setTexto] = useState("");
  const [assunto, setAssunto] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvo, setSalvo] = useState<{ slug?: string; fila?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || status === "running") return;

    setStatus("running");
    setMensagem(null);
    setSalvo(null);

    try {
      const res = await fetch("/api/ingest-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, assunto: assunto || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar.");

      setSalvo(data);
      setStatus("done");
      setTexto("");
      aoSalvar?.();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Erro desconhecido.");
      setStatus("error");
    }
  }

  const rodando = status === "running";

  return (
    <form
      onSubmit={handleSubmit}
      className="painel p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor="texto-colado"
          className="text-sm font-medium"
        >
          Cole o texto
        </label>
        <select
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          disabled={rodando}
          className="campo py-1.5 text-sm"
        >
          <option value="">Sem assunto</option>
          {ASSUNTOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <textarea
        id="texto-colado"
        required
        rows={16}
        placeholder="Cole aqui um texto (anotação, ideia, trecho de aula…) ou só um link (GitHub, artigo, doc)…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={rodando}
        className="campo mt-3 w-full resize-y px-4 py-3 leading-relaxed"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted">
          Texto: salva como está, sem IA. Link: busca o conteúdo (README do
          GitHub, Google Docs público, texto da página) e salva puro também.
          Vídeo: entra na fila.
        </p>
        <button
          type="submit"
          disabled={rodando || !texto.trim()}
          className="shrink-0 botao"
        >
          {rodando ? "Salvando…" : "Adicionar ao cérebro"}
        </button>
      </div>

      {status === "error" && mensagem && (
        <p className="mt-4 text-sm text-danger">Erro: {mensagem}</p>
      )}

      {status === "done" && salvo && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          {salvo.fila ? (
            <p className="text-sm font-medium text-primary-strong">
              ✓ Vídeo na fila — será transcrito no seu PC
            </p>
          ) : (
            <Link
              href={`/nota/${salvo.slug}`}
              className="text-sm font-medium text-primary-strong hover:underline"
            >
              ✓ Salvo — abrir nota
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
