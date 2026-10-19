"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ChecklistDia } from "../ChecklistDia";
import { hojeISO } from "@/lib/datas";
import type { ItemDia } from "@/lib/dia";

const FORMATO_DIA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });
const FORMATO_SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });

// Topo da Início: o dia de hoje em destaque (o marca-texto laranja cresce
// conforme os itens de hoje são marcados), e embaixo o checklist ao lado de `aoLado`.
export function Hoje({ totalDiasIngles, aoLado }: { totalDiasIngles: number; aoLado: ReactNode }) {
  const [hoje] = useState(hojeISO);
  const [itens, setItens] = useState<ItemDia[]>([]);
  const [ingles, setIngles] = useState<number | null>(null);
  const [estudos, setEstudos] = useState<{ feitos: number; total: number } | null>(null);

  function carregarHoje() {
    fetch(`/api/dia?data=${hoje}`)
      .then((res) => res.json())
      .then((d) => setItens(d.itens ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    carregarHoje();
    fetch("/api/ingles")
      .then((res) => res.json())
      .then((data) => setIngles((data.feitos ?? []).length))
      .catch(() => {});
    fetch("/api/estudos")
      .then((res) => res.json())
      .then((data) => {
        const topicos: { feito: boolean }[] = (data.secoes ?? []).flatMap((s: { topicos: { feito: boolean }[] }) => s.topicos);
        setEstudos({ feitos: topicos.filter((t) => t.feito).length, total: topicos.length });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = new Date(`${hoje}T12:00:00`);
  const diaDaSemana = FORMATO_SEMANA.format(data);
  const feitosAtivos = itens.filter((i) => i.feito).length;
  const progresso = itens.length ? Math.round((feitosAtivos / itens.length) * 100) : 0;

  return (
    <>
      <section aria-labelledby="titulo-hoje">
        <p className="text-[0.94rem] font-medium text-muted">
          {diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1)}
        </p>
        <h1 id="titulo-hoje" className="relative mt-1 inline-block text-5xl font-bold tracking-[-0.035em] sm:text-7xl">
          <span
            aria-hidden="true"
            className="marca-texto-progresso absolute bottom-[0.1em] left-0 h-[0.28em] rounded-full bg-primary/25"
            style={{ width: `${Math.max(progresso, 3)}%` }}
          />
          <span className="relative">{FORMATO_DIA.format(data)}</span>
        </h1>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.94rem] tabular-nums text-muted">
          <span>
            <strong className="font-semibold text-foreground">
              {feitosAtivos} de {itens.length}
            </strong>{" "}
            feitos hoje
          </span>
          <Link href="/ingles" className="hover:text-primary-strong">
            Inglês {ingles ?? "–"}/{totalDiasIngles} dias
          </Link>
          <Link href="/estudos" className="hover:text-primary-strong">
            Estudos {estudos ? `${estudos.feitos}/${estudos.total}` : "–"}
          </Link>
        </p>
      </section>

      <div className="mt-10 grid items-start gap-5 md:grid-cols-2">
        <section aria-labelledby="titulo-habitos" className="painel p-5">
          <h2 id="titulo-habitos" className="px-2 text-lg font-semibold">
            O que fazer hoje
          </h2>
          <div className="mt-2">
            <ChecklistDia data={hoje} onMudou={carregarHoje} />
          </div>
        </section>
        {aoLado}
      </div>
    </>
  );
}
