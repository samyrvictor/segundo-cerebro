"use client";

import Link from "next/link";
import { useState } from "react";
import { ASSUNTOS } from "@/lib/assuntos";

export function PdfUpload() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [assunto, setAssunto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    setSlug(null);

    const form = new FormData();
    form.append("arquivo", arquivo);
    if (assunto) form.append("assunto", assunto);

    const res = await fetch("/api/ingest-pdf", { method: "POST", body: form }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.slug) setSlug(data.slug);
    else setErro(data?.error ?? "Não consegui enviar o PDF.");
    setEnviando(false);
  }

  return (
    <form onSubmit={enviar} className="painel p-6">
      <p className="text-sm font-medium">Enviar PDF</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {/* Botão próprio no lugar do "Escolher ficheiro" do navegador. */}
        <label className="inline-flex max-w-full cursor-pointer items-center rounded-full bg-black/[0.05] px-4 py-2 text-sm font-medium hover:bg-black/[0.08] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary/40">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
          <span className="truncate">{arquivo ? arquivo.name : "Escolher PDF"}</span>
        </label>
        <select
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          className="campo py-1.5 text-sm"
        >
          <option value="">Sem assunto</option>
          {ASSUNTOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!arquivo || enviando}
          className="botao"
        >
          {enviando ? "Lendo PDF…" : "Enviar"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Até 4 MB. O texto do PDF é salvo puro, sem IA (PDF escaneado não tem texto).</p>
      {erro && <p className="mt-3 text-sm text-danger">Erro: {erro}</p>}
      {slug && (
        <Link href={`/nota/${slug}`} className="mt-3 inline-block text-sm text-primary hover:underline">
          ✓ PDF salvo — abrir nota
        </Link>
      )}
    </form>
  );
}
