"use client";

import { useEffect, useState } from "react";
import { AREAS, COLUNAS, type Area, type Coluna, type Tarefa } from "@/lib/quadro";
import { IconeOpcoes } from "./Icones";

const COR_AREA: Record<Area, string> = {
  estudo: "bg-primary-soft text-primary-strong",
  trabalho: "bg-foreground/[0.07] text-foreground/80",
  pessoal: "bg-[#e8f1ea] text-[#2f6b45]",
};

function nomeArea(area: Area | null) {
  return AREAS.find((a) => a.id === area)?.nome;
}

export function QuadroView() {
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null);
  const [filtro, setFiltro] = useState<Area | null>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [sobre, setSobre] = useState<Coluna | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tarefas")
      .then((res) => res.json())
      .then((data) => setTarefas(data.tarefas ?? []))
      .catch(() => setErro("Não consegui carregar o quadro."));
  }, []);

  // Toda mudança: aplica na tela na hora e confirma com a lista que o servidor devolve.
  function enviar(metodo: string, corpo?: object, url = "/api/tarefas") {
    setErro(null);
    fetch(url, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.tarefas) setTarefas(data.tarefas);
        else setErro(data.error ?? "Não consegui salvar.");
      })
      .catch(() => setErro("Não consegui salvar. Confira a internet e tente de novo."));
  }

  function atualizar(id: number, mudancas: Partial<Tarefa>) {
    setTarefas((prev) => prev?.map((t) => (t.id === id ? { ...t, ...mudancas } : t)) ?? prev);
    enviar("PATCH", { id, ...mudancas });
  }

  // Solta no fim da coluna, ou antes do cartão `antesDe`.
  function mover(id: number, coluna: Coluna, antesDe?: Tarefa) {
    const daColuna = (tarefas ?? []).filter((t) => t.coluna === coluna && t.id !== id);
    let ordem: number;
    if (antesDe) {
      const i = daColuna.findIndex((t) => t.id === antesDe.id);
      const anterior = daColuna[i - 1]?.ordem ?? antesDe.ordem - 1;
      ordem = (anterior + antesDe.ordem) / 2;
    } else {
      ordem = (daColuna.at(-1)?.ordem ?? 0) + 1;
    }
    setTarefas((prev) => [...(prev ?? []).map((t) => (t.id === id ? { ...t, coluna, ordem } : t))].sort((a, b) => a.ordem - b.ordem));
    enviar("PATCH", { id, coluna, ordem });
  }

  function apagar(t: Tarefa) {
    if (!confirm(`Apagar "${t.titulo}"?`)) return;
    setTarefas((prev) => prev?.filter((x) => x.id !== t.id) ?? prev);
    enviar("DELETE", undefined, `/api/tarefas?id=${t.id}`);
  }

  if (tarefas === null) return <p className="mt-8 text-sm text-muted">{erro ?? "Carregando…"}</p>;

  const visiveis = filtro ? tarefas.filter((t) => t.area === filtro) : tarefas;

  return (
    <div className="mt-6">
      <div className="segmentos" role="group" aria-label="Filtrar por área">
        {[{ id: null, nome: "Tudo" }, ...AREAS].map((a) => (
          <button
            key={a.nome}
            type="button"
            aria-pressed={filtro === a.id}
            onClick={() => setFiltro(a.id as Area | null)}
            className="segmento"
          >
            {a.nome}
          </button>
        ))}
      </div>
      {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {COLUNAS.map((coluna) => {
          const cartoes = visiveis.filter((t) => t.coluna === coluna.id);
          return (
            <section
              key={coluna.id}
              aria-labelledby={`coluna-${coluna.id}`}
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(coluna.id);
              }}
              onDragLeave={() => setSobre(null)}
              onDrop={(e) => {
                e.preventDefault();
                setSobre(null);
                if (arrastando !== null) mover(arrastando, coluna.id);
              }}
              className={`flex min-h-48 flex-col rounded-[18px] p-3 transition-colors duration-200 ${
                sobre === coluna.id ? "bg-primary-soft" : "bg-black/[0.035]"
              }`}
            >
              <h2 id={`coluna-${coluna.id}`} className="flex items-baseline justify-between px-1.5 pt-1 text-[0.94rem] font-semibold">
                {coluna.nome}
                <span className="text-xs font-normal tabular-nums text-muted">{cartoes.length}</span>
              </h2>

              <ul className="mt-3 flex flex-col gap-2">
                {cartoes.map((t) => (
                  <Cartao
                    key={t.id}
                    tarefa={t}
                    onArrastar={() => setArrastando(t.id)}
                    onSoltarSobre={() => arrastando !== null && arrastando !== t.id && mover(arrastando, coluna.id, t)}
                    onFimArrasto={() => setArrastando(null)}
                    onRenomear={(titulo) => atualizar(t.id, { titulo })}
                    onArea={(area) => atualizar(t.id, { area })}
                    onMover={(destino) => mover(t.id, destino)}
                    onApagar={() => apagar(t)}
                  />
                ))}
                {cartoes.length === 0 && (
                  <li className="rounded-xl px-3 py-5 text-center text-sm text-muted">
                    {coluna.id === "a_fazer" ? "Escreva abaixo a primeira coisa a fazer." : "Arraste um cartão para cá."}
                  </li>
                )}
              </ul>

              {coluna.id !== "feito" && <NovoCartao coluna={coluna.id} area={filtro} onCriar={(corpo) => enviar("POST", corpo)} />}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function NovoCartao({
  coluna,
  area,
  onCriar,
}: {
  coluna: Coluna;
  area: Area | null;
  onCriar: (corpo: { titulo: string; coluna: Coluna; area: Area | null }) => void;
}) {
  const [titulo, setTitulo] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!titulo.trim()) return;
        onCriar({ titulo: titulo.trim(), coluna, area });
        setTitulo("");
      }}
      className="mt-2"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Novo cartão"
        aria-label={`Novo cartão em ${COLUNAS.find((c) => c.id === coluna)?.nome}`}
        autoComplete="off"
        className="w-full rounded-xl bg-transparent px-3 py-2 text-[0.94rem] placeholder:text-muted hover:bg-white/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(255,90,31,0.3)] focus:outline-none"
      />
    </form>
  );
}

function Cartao({
  tarefa,
  onArrastar,
  onSoltarSobre,
  onFimArrasto,
  onRenomear,
  onArea,
  onMover,
  onApagar,
}: {
  tarefa: Tarefa;
  onArrastar: () => void;
  onSoltarSobre: () => void;
  onFimArrasto: () => void;
  onRenomear: (titulo: string) => void;
  onArea: (area: Area | null) => void;
  onMover: (coluna: Coluna) => void;
  onApagar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const feito = tarefa.coluna === "feito";

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onArrastar();
      }}
      onDragEnd={onFimArrasto}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSoltarSobre();
      }}
      className="cursor-grab rounded-xl bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_20px_rgba(0,0,0,0.07)] active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <input
          defaultValue={tarefa.titulo}
          aria-label="Título do cartão"
          onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== tarefa.titulo && onRenomear(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={`min-w-0 flex-1 bg-transparent text-[0.94rem] focus:outline-none ${feito ? "text-muted line-through" : ""}`}
        />
        <button
          type="button"
          aria-label="Opções do cartão"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-black/[0.05] hover:text-foreground"
        >
          <IconeOpcoes />
        </button>
      </div>
      {tarefa.area && (
        <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COR_AREA[tarefa.area]}`}>{nomeArea(tarefa.area)}</span>
      )}

      {aberto && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-xs">
          <label className="flex items-center justify-between gap-2">
            <span className="text-muted">Área</span>
            <select
              value={tarefa.area ?? ""}
              onChange={(e) => onArea((e.target.value || null) as Area | null)}
              className="campo py-1"
            >
              <option value="">Nenhuma</option>
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-muted">Mover para</span>
            <select
              value={tarefa.coluna}
              onChange={(e) => {
                onMover(e.target.value as Coluna);
                setAberto(false);
              }}
              className="campo py-1"
            >
              {COLUNAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onApagar} className="self-start text-danger hover:underline">
            Apagar cartão
          </button>
        </div>
      )}
    </li>
  );
}
