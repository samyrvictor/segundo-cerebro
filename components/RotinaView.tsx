"use client";

import { useState } from "react";
import { ChecklistDia } from "./ChecklistDia";
import { useRotina } from "./useRotina";
import { MESES, formatarData, hojeISO, isoLocal } from "@/lib/datas";
import { IconeAnterior, IconeProximo } from "./Icones";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function corDaCelula(proporcao: number): string {
  if (proporcao === 0) return "bg-border/60";
  if (proporcao < 0.5) return "bg-primary/30";
  if (proporcao < 1) return "bg-primary/60";
  return "bg-primary";
}

export function RotinaView() {
  const hoje = hojeISO();
  const [ano, setAno] = useState(Number(hoje.slice(0, 4)));
  const [selecionado, setSelecionado] = useState(hoje);
  const { dias, carregando, recarregar } = useRotina(ano);

  const itensSelecionado = dias[selecionado] ?? [];
  const diasCompletos = Object.values(dias).filter((itens) => itens.length > 0 && itens.every((i) => i.feito)).length;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_1fr]">
      <aside className="h-fit painel p-5 lg:sticky lg:top-8">
        <p className="text-sm text-muted">{selecionado === hoje ? "Hoje" : "Dia selecionado"}</p>
        <h2 className="mt-1 font-display text-xl font-semibold">{formatarData(selecionado)}</h2>
        <p className="mt-1 text-xs tabular-nums text-muted">
          {itensSelecionado.filter((i) => i.feito).length} de {itensSelecionado.length} feitos
        </p>

        <div className="mt-4">
          {carregando ? (
            <p className="text-sm text-muted">Carregando…</p>
          ) : (
            <ChecklistDia data={selecionado} onMudou={recarregar} />
          )}
        </div>

        {selecionado !== hoje && (
          <button
            type="button"
            onClick={() => {
              setSelecionado(hoje);
              setAno(Number(hoje.slice(0, 4)));
            }}
            className="mt-4 text-xs font-medium text-primary underline"
          >
            Voltar para hoje
          </button>
        )}

        <p className="mt-6 border-t border-border pt-4 text-xs text-muted">
          Cada dia vira uma nota em <code className="font-mono">rotina/diario/</code> no Obsidian.
        </p>
      </aside>

      <section>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Ano anterior"
              onClick={() => setAno((a) => a - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] hover:bg-black/[0.08]"
            >
              <IconeAnterior />
            </button>
            <span className="font-display text-2xl font-semibold">{ano}</span>
            <button
              type="button"
              aria-label="Próximo ano"
              onClick={() => setAno((a) => a + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] hover:bg-black/[0.08]"
            >
              <IconeProximo />
            </button>
          </div>
          <p className="text-sm text-muted">
            <strong className="text-foreground">{diasCompletos}</strong> dias completos
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MESES.map((nomeMes, mes) => {
            const primeiroDia = new Date(ano, mes, 1).getDay();
            const totalDias = new Date(ano, mes + 1, 0).getDate();
            return (
              <div key={nomeMes} className="painel p-4">
                <h3 className="font-display text-sm font-semibold">{nomeMes}</h3>
                <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                  {DIAS_SEMANA.map((d, i) => (
                    <span key={i} className="text-[10px] text-muted">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: primeiroDia }).map((_, i) => (
                    <span key={`vazio-${i}`} />
                  ))}
                  {Array.from({ length: totalDias }).map((_, i) => {
                    const data = isoLocal(new Date(ano, mes, i + 1));
                    const itens = dias[data] ?? [];
                    const feitos = itens.filter((it) => it.feito).length;
                    const proporcao = itens.length ? feitos / itens.length : 0;
                    const futuro = data > hoje;
                    return (
                      <button
                        key={data}
                        type="button"
                        title={`${formatarData(data)} — ${feitos}/${itens.length}`}
                        onClick={() => setSelecionado(data)}
                        className={`aspect-square rounded text-[10px] transition-transform hover:scale-110 ${corDaCelula(
                          proporcao
                        )} ${proporcao === 1 ? "text-white" : "text-foreground/70"} ${
                          futuro ? "opacity-40" : ""
                        } ${data === selecionado ? "ring-2 ring-primary-strong" : ""} ${
                          data === hoje ? "font-bold" : ""
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <span>Menos</span>
          {[0, 0.3, 0.7, 1].map((p) => (
            <span key={p} className={`h-3 w-3 rounded ${corDaCelula(p)}`} />
          ))}
          <span>Mais</span>
        </div>
      </section>
    </div>
  );
}
