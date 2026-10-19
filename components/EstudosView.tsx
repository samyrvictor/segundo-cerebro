"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "./Check";
import { IconeFechar } from "./Icones";

interface Secao {
  nome: string;
  topicos: { texto: string; feito: boolean }[];
}

export function EstudosView() {
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novos, setNovos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/estudos")
      .then((res) => res.json())
      .then((data) => setSecoes(data.secoes ?? []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  function enviar(corpo: Record<string, unknown>) {
    return fetch("/api/estudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.secoes) setSecoes(data.secoes);
      })
      .catch(() => {});
  }

  function alternar(topico: string, feito: boolean) {
    setSecoes((prev) =>
      prev.map((s) => ({
        ...s,
        topicos: s.topicos.map((t) => (t.texto === topico ? { ...t, feito } : t)),
      }))
    );
    enviar({ acao: "marcar", topico, feito });
  }

  function remover(topico: string) {
    if (!confirm(`Tirar "${topico}" dos seus estudos?`)) return;
    setSecoes((prev) => prev.map((s) => ({ ...s, topicos: s.topicos.filter((t) => t.texto !== topico) })));
    enviar({ acao: "remover", topico });
  }

  function adicionar(secao: string) {
    const topico = novos[secao]?.trim();
    if (!topico) return;
    setNovos((prev) => ({ ...prev, [secao]: "" }));
    enviar({ acao: "adicionar", secao, topico });
  }

  if (carregando) return <p className="mt-8 text-sm text-muted">Carregando…</p>;

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {secoes.map((secao) => {
        const feitos = secao.topicos.filter((t) => t.feito).length;
        return (
          <section key={secao.nome} className="painel p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold">{secao.nome}</h2>
              <span className="font-mono text-xs text-muted">
                {feitos}/{secao.topicos.length}
              </span>
            </div>

            <ul className="mt-3 flex flex-col">
              {secao.topicos.map((t) => (
                <li key={t.texto} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Check label={t.texto} feito={t.feito} onToggle={() => alternar(t.texto, !t.feito)} />
                  </div>
                  <Link
                    href={`/buscar?q=${encodeURIComponent(t.texto)}`}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-muted hover:bg-primary-soft hover:text-primary"
                    title="Buscar esse assunto no cérebro"
                  >
                    buscar
                  </Link>
                  <button
                    type="button"
                    onClick={() => remover(t.texto)}
                    aria-label={`Remover ${t.texto}`}
                    title="Remover tópico"
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-muted hover:bg-primary-soft hover:text-danger"
                  >
                    <IconeFechar />
                  </button>
                </li>
              ))}
            </ul>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                adicionar(secao.nome);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={novos[secao.nome] ?? ""}
                onChange={(e) => setNovos((prev) => ({ ...prev, [secao.nome]: e.target.value }))}
                placeholder="Novo tópico…"
                autoComplete="off"
                className="campo flex-1"
              />
              <button
                type="submit"
                className="botao"
              >
                Adicionar
              </button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
