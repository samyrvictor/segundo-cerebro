"use client";

import { useEffect, useState } from "react";
import { ESTRATEGIA, FASES, PERFIL, SEMANAS, TOTAL_DIAS, diasDaSemana } from "@/lib/ingles/plano";
import { IconeProximo } from "./Icones";

export function InglesView() {
  const [feitos, setFeitos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ingles")
      .then((res) => res.json())
      .then((data) => setFeitos(data.feitos ?? []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  function alternar(id: string) {
    const feito = !feitos.includes(id);
    const antes = feitos;
    setFeitos(feito ? [...feitos, id] : feitos.filter((f) => f !== id));
    fetch("/api/ingles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, feito }),
    }).catch(() => setFeitos(antes));
  }

  const percentual = Math.round((feitos.length / TOTAL_DIAS) * 100);
  const semanaAtual =
    SEMANAS.find((s) => diasDaSemana(s).some((d) => !feitos.includes(d.id)))?.numero ?? SEMANAS.length;
  const proximoDia = SEMANAS.flatMap(diasDaSemana).find((d) => !feitos.includes(d.id))?.id ?? null;
  const diaAberto = selecionado ?? proximoDia;

  return (
    <div className="mt-8 flex flex-col gap-8">
      <section className="painel p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Progresso geral</p>
            <p className="mt-1 font-display text-4xl font-semibold text-primary">{carregando ? "—" : `${percentual}%`}</p>
          </div>
          <p className="text-right text-sm text-muted">
            {feitos.length} de {TOTAL_DIAS} dias da Fase 1
            <br />
            Você está na <strong className="text-foreground">semana {semanaAtual}</strong>
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-border/60">
          <div className="marca-texto-progresso h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="painel p-6">
          <h2 className="font-display text-lg font-semibold">Seu perfil</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            {[
              ["Nível atual", PERFIL.nivelAtual],
              ["Meta", PERFIL.meta],
              ["Tempo ativo", PERFIL.tempoAtivo],
              ["Dificuldades", PERFIL.dificuldades],
              ["Objetivo", PERFIL.objetivo],
              ["Habilidade principal", PERFIL.habilidadePrincipal],
              ["Interesses", PERFIL.interesses],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-36 shrink-0 text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="painel p-6">
          <h2 className="font-display text-lg font-semibold">Fases até o C1</h2>
          <ol className="mt-3 flex flex-col gap-3">
            {FASES.map((f) => (
              <li key={f.nome} className={f.detalhada ? "" : "opacity-60"}>
                <p className="text-sm font-medium">
                  {f.nome} <span className="text-xs font-semibold text-primary">{f.nivel}</span>
                </p>
                <p className="text-xs text-muted">
                  {f.periodo} — {f.resumo}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="painel p-6">
        <h2 className="font-display text-lg font-semibold">Estratégia</h2>
        <div className="mt-3 flex flex-col divide-y divide-border">
          {ESTRATEGIA.map((e) => (
            <details key={e.titulo} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                <span className="mr-2 inline-flex align-[-3px] text-primary transition-transform group-open:rotate-90">
                  <IconeProximo />
                </span>
                {e.titulo}
              </summary>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-9 text-sm text-muted">
                {e.itens.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">
          Roteiro semana a semana
        </h2>

        {SEMANAS.map((s) => {
          const dias = diasDaSemana(s);
          const concluidos = dias.filter((d) => feitos.includes(d.id)).length;
          const dia = dias.find((d) => d.id === diaAberto);
          return (
            <details
              key={s.numero}
              open={s.numero === semanaAtual}
              className="group painel"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden">
                <div>
                  <p className="text-xs font-medium text-muted">Semana {s.numero}</p>
                  <h3 className="font-display text-lg font-semibold">{s.tema}</h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                    concluidos === 7 ? "bg-primary text-white" : "bg-primary-soft text-primary-strong"
                  }`}
                >
                  {concluidos}/7
                </span>
              </summary>

              <div className="flex flex-col gap-5 border-t border-border p-5">
                <div className="rounded-2xl bg-primary-soft p-4">
                  <p className="text-sm font-semibold text-primary-strong">Gramática: {s.gramatica.titulo}</p>
                  <p className="mt-1 text-sm">{s.gramatica.explicacao}</p>
                  <ul className="mt-2 flex flex-col gap-0.5 text-sm text-primary-strong">
                    {s.gramatica.exemplos.map((ex) => (
                      <li key={ex}>→ {ex}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted">Recursos</p>
                    <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
                      {s.recursos.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted">Micro-hábito da semana</p>
                    <p className="mt-2 text-sm">{s.microHabito}</p>
                  </div>
                </div>

                <details>
                  <summary className="cursor-pointer text-sm font-medium text-primary">
                    Vocabulário da semana ({s.vocab.length})
                  </summary>
                  <div className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    {s.vocab.map(([en, pt]) => (
                      <p key={en}>
                        <span className="font-medium">{en}</span> <span className="text-muted">— {pt}</span>
                      </p>
                    ))}
                  </div>
                </details>

                <div>
                  <p className="text-xs font-medium text-muted">Dias</p>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {dias.map((d) => {
                      const feito = feitos.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelecionado(d.id)}
                          className={`rounded-xl px-1 py-2 text-center text-xs ${
                            d.id === diaAberto ? "ring-2 ring-primary/60" : ""
                          } ${feito ? "bg-primary text-white" : "bg-black/[0.04] hover:bg-black/[0.07]"}`}
                        >
                          <span className="block font-medium">Dia {d.numero}</span>
                          <span className="block truncate opacity-80">{feito ? "Feito" : d.curto}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {dia && (
                  <div className="rounded-2xl bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted">
                          Dia {dia.numero}, 30 min
                        </p>
                        <p className="font-display text-base font-semibold">{dia.foco}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => alternar(dia.id)}
                        className={feitos.includes(dia.id) ? "shrink-0 rounded-full bg-black/[0.05] px-4 py-2 text-sm font-medium text-muted hover:bg-black/[0.08]" : "botao shrink-0"}
                      >
                        {feitos.includes(dia.id) ? "Desmarcar" : "Marcar como feito"}
                      </button>
                    </div>
                    <ol className="mt-3 flex flex-col gap-3">
                      {dia.blocos.map((b, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-primary">{b.minutos} min</span>
                          <div>
                            <p>{b.atividade}</p>
                            <p className="mt-0.5 text-xs text-muted">Recurso: {b.recurso}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
                      Fora dos 30 min: barril no trânsito / treino / louça · Micro-hábito: {s.microHabito}
                    </p>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </section>

      <p className="text-sm text-muted">
        Terminou a Fase 1? Peça ao Claude Code: &ldquo;gera a Fase 2 do plano de inglês&rdquo;.
      </p>
    </div>
  );
}
