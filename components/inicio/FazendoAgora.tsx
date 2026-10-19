"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AREAS, type Tarefa } from "@/lib/quadro";

// Resumo do Quadro na Início: o que está em "Fazendo" + atalho para criar cartão.
export function FazendoAgora() {
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null);
  const [novo, setNovo] = useState("");

  useEffect(() => {
    fetch("/api/tarefas")
      .then((res) => res.json())
      .then((data) => setTarefas(data.tarefas ?? []))
      .catch(() => setTarefas([]));
  }, []);

  function criar(e: React.FormEvent) {
    e.preventDefault();
    const titulo = novo.trim();
    if (!titulo) return;
    setNovo("");
    fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, coluna: "fazendo" }),
    })
      .then((res) => res.json())
      .then((data) => data.tarefas && setTarefas(data.tarefas))
      .catch(() => {});
  }

  const fazendo = (tarefas ?? []).filter((t) => t.coluna === "fazendo");
  const aFazer = (tarefas ?? []).filter((t) => t.coluna === "a_fazer").length;

  return (
    <section aria-labelledby="titulo-fazendo" className="painel p-5">
      <div className="flex items-baseline justify-between gap-4 px-2">
        <h2 id="titulo-fazendo" className="text-lg font-semibold">
          Fazendo agora
        </h2>
        <Link href="/quadro" className="text-sm font-medium text-primary hover:text-primary-strong">
          Abrir quadro{aFazer ? ` (${aFazer} a fazer)` : ""}
        </Link>
      </div>

      <ul className="mt-2 flex flex-col">
        {tarefas === null && <li className="px-2 py-2 text-sm text-muted">Carregando…</li>}
        {tarefas !== null && fazendo.length === 0 && (
          <li className="px-2 py-2 text-[0.94rem] text-muted">Nada em andamento. Escreva abaixo o que você vai fazer agora.</li>
        )}
        {fazendo.map((t) => (
          <li
            key={t.id}
            className="flex min-h-11 items-center justify-between gap-3 border-b border-border px-2 text-[0.94rem] last:border-0"
          >
            <span>{t.titulo}</span>
            {t.area && (
              <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-strong">
                {AREAS.find((a) => a.id === t.area)?.nome}
              </span>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={criar} className="mt-3">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Começar algo agora"
          aria-label="Novo cartão em Fazendo"
          autoComplete="off"
          className="campo w-full"
        />
      </form>
    </section>
  );
}
