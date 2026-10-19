"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLUNAS } from "@/lib/quadro";
import { partesDestacadas, termosDaBusca } from "@/lib/texto";

interface Resultados {
  notas: { slug: string; titulo: string; plataforma: string; data_ingestao: string; trecho: string }[];
  estudos: { secao: string; topico: string; feito: boolean }[];
  quadro: { id: number; titulo: string; coluna: string; area: string | null }[];
  ingles: { semana: number; tema: string; tipo: string; texto: string }[];
}

type Tipo = "tudo" | "notas" | "estudos" | "quadro" | "ingles";

const TIPOS: { id: Tipo; nome: string }[] = [
  { id: "tudo", nome: "Tudo" },
  { id: "notas", nome: "Notas" },
  { id: "estudos", nome: "Estudos" },
  { id: "quadro", nome: "Quadro" },
  { id: "ingles", nome: "Inglês" },
];

const CHAVE_RECENTES = "busca:recentes";

function lerRecentes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RECENTES) ?? "[]");
  } catch {
    return [];
  }
}

function guardarRecente(q: string) {
  try {
    const lista = [q, ...lerRecentes().filter((r) => r !== q)].slice(0, 8);
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify(lista));
  } catch {
    // sem localStorage (aba anônima): só não guarda
  }
}

function Destaque({ texto, termos }: { texto: string; termos: string[] }) {
  return (
    <>
      {partesDestacadas(texto, termos).map((p, i) =>
        p.marcado ? (
          <mark key={i} className="rounded-sm bg-primary-soft px-0.5 text-foreground">
            {p.texto}
          </mark>
        ) : (
          <span key={i}>{p.texto}</span>
        )
      )}
    </>
  );
}

export function BuscaForm({ inicial = "" }: { inicial?: string }) {
  const [query, setQuery] = useState(inicial);
  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [tipo, setTipo] = useState<Tipo>("tudo");
  const [origem, setOrigem] = useState<string | null>(null);
  const [recentes, setRecentes] = useState<string[]>([]);
  const campo = useRef<HTMLInputElement>(null);

  const consulta = query.trim();
  const termos = useMemo(() => termosDaBusca(consulta), [consulta]);

  useEffect(() => {
    const timer = setTimeout(() => setRecentes(lerRecentes()), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!consulta) return;
    const timer = setTimeout(() => {
      setBuscando(true);
      fetch(`/api/search?q=${encodeURIComponent(consulta)}`)
        .then((res) => res.json())
        .then((data: Resultados) => {
          setResultados(data);
          setOrigem(null);
          guardarRecente(consulta);
        })
        .catch(() => {})
        .finally(() => setBuscando(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [consulta]);

  const r = consulta ? resultados : null;
  const origens = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const n of r?.notas ?? []) contagem.set(n.plataforma, (contagem.get(n.plataforma) ?? 0) + 1);
    return [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  }, [r]);

  const notas = (r?.notas ?? []).filter((n) => !origem || n.plataforma === origem);
  const total = r ? r.notas.length + r.estudos.length + r.quadro.length + r.ingles.length : 0;
  const quantos: Record<Tipo, number> = {
    tudo: total,
    notas: r?.notas.length ?? 0,
    estudos: r?.estudos.length ?? 0,
    quadro: r?.quadro.length ?? 0,
    ingles: r?.ingles.length ?? 0,
  };
  const mostrar = (t: Tipo) => tipo === "tudo" || tipo === t;

  return (
    <div>
      <input
        ref={campo}
        type="search"
        autoFocus
        placeholder="Buscar em notas, estudos, quadro e inglês"
        aria-label="Buscar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        className="campo w-full rounded-2xl px-5 py-4 text-xl font-medium sm:text-2xl"
      />

      {!consulta && recentes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-muted">Buscas recentes</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentes.map((rec) => (
              <button
                key={rec}
                type="button"
                onClick={() => {
                  setQuery(rec);
                  campo.current?.focus();
                }}
                className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-sm hover:bg-black/[0.08]"
              >
                {rec}
              </button>
            ))}
          </div>
        </div>
      )}

      {consulta && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="segmentos" role="group" aria-label="Tipo de resultado">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tipo === t.id}
              onClick={() => setTipo(t.id)}
              className="segmento tabular-nums"
            >
              {t.nome} {r ? quantos[t.id] : ""}
            </button>
          ))}
          </div>
          {buscando && <span className="text-sm text-muted">Buscando…</span>}
        </div>
      )}

      {r && total === 0 && !buscando && (
        <p className="mt-8 text-sm text-muted">
          Nada encontrado para &ldquo;{consulta}&rdquo;. Tente só o começo da palavra ou outro termo.
        </p>
      )}

      {r && mostrar("notas") && r.notas.length > 0 && (
        <section className="painel mt-6 p-5" aria-labelledby="grupo-notas">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 id="grupo-notas" className="font-display text-lg font-semibold">
              Notas
            </h2>
            {origens.length > 1 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Origem das notas">
                {origens.map(([nome, n]) => (
                  <button
                    key={nome}
                    type="button"
                    aria-pressed={origem === nome}
                    onClick={() => setOrigem(origem === nome ? null : nome)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      origem === nome ? "bg-foreground text-white" : "bg-black/[0.05] text-muted hover:text-foreground"
                    }`}
                  >
                    {nome} {n}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ul className="mt-2">
            {notas.map((n) => (
              <li key={n.slug} className="border-b border-border last:border-0">
                <Link href={`/nota/${n.slug}`} className="group block py-3">
                  <span className="font-medium group-hover:text-primary-strong">
                    <Destaque texto={n.titulo} termos={termos} />
                  </span>
                  <span className="ml-2 text-xs text-muted">
                    {n.plataforma}, {n.data_ingestao}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    <Destaque texto={n.trecho} termos={termos} />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r && mostrar("estudos") && r.estudos.length > 0 && (
        <section className="painel mt-5 p-5" aria-labelledby="grupo-estudos">
          <h2 id="grupo-estudos" className="font-display text-lg font-semibold">
            Estudos
          </h2>
          <ul className="mt-2">
            {r.estudos.map((e) => (
              <li key={e.topico} className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-sm last:border-0">
                <Link href="/estudos" className="hover:text-primary-strong">
                  <Destaque texto={e.topico} termos={termos} />
                </Link>
                <span className="shrink-0 text-xs text-muted">
                  {e.secao}
                  {e.feito ? ", já domino" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r && mostrar("quadro") && r.quadro.length > 0 && (
        <section className="painel mt-5 p-5" aria-labelledby="grupo-quadro">
          <h2 id="grupo-quadro" className="font-display text-lg font-semibold">
            Quadro
          </h2>
          <ul className="mt-2">
            {r.quadro.map((t) => (
              <li key={t.id} className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-sm last:border-0">
                <Link href="/quadro" className="hover:text-primary-strong">
                  <Destaque texto={t.titulo} termos={termos} />
                </Link>
                <span className="shrink-0 text-xs text-muted">{COLUNAS.find((c) => c.id === t.coluna)?.nome}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r && mostrar("ingles") && r.ingles.length > 0 && (
        <section className="painel mt-5 p-5" aria-labelledby="grupo-ingles">
          <h2 id="grupo-ingles" className="font-display text-lg font-semibold">
            Inglês
          </h2>
          <ul className="mt-2">
            {r.ingles.map((i, n) => (
              <li key={n} className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-sm last:border-0">
                <Link href="/ingles" className="hover:text-primary-strong">
                  <Destaque texto={i.texto} termos={termos} />
                </Link>
                <span className="shrink-0 text-xs text-muted">
                  {i.tipo}, semana {i.semana}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
