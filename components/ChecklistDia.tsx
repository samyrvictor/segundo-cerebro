"use client";

import { useEffect, useState } from "react";
import { Check } from "./Check";
import { IconeFechar } from "./Icones";
import type { ItemDia } from "@/lib/dia";

interface Props {
  data: string; // "AAAA-MM-DD" — o dia que este checklist mostra e edita
  onMudou?: () => void;
}

// Checklist de um dia específico: escreva o que precisa fazer e marque
// quando terminar. Sem lista fixa por trás — cada dia é editado na hora.
export function ChecklistDia({ data, onMudou }: Props) {
  const [itens, setItens] = useState<ItemDia[] | null>(null);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [novo, setNovo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/dia?data=${data}`)
      .then((res) => res.json())
      .then((d) => {
        if (cancelado) return;
        setItens(d.itens ?? []);
        setSugestoes(d.sugestoes ?? []);
        setErro(null);
      })
      .catch(() => {
        if (!cancelado) setErro("Não consegui carregar este dia.");
      });
    return () => {
      cancelado = true;
    };
  }, [data]);

  function adicionar(texto: string) {
    const t = texto.trim();
    if (!t) return;
    setErro(null);
    setNovo("");
    const provisorio: ItemDia = { id: -Date.now(), texto: t, feito: false };
    setItens((prev) => [...(prev ?? []), provisorio]);
    fetch("/api/dia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, texto: t }),
    })
      .then((res) => res.json())
      .then((d) => {
        if (!d.item) throw new Error(d.error);
        setItens((prev) => prev?.map((i) => (i.id === provisorio.id ? d.item : i)) ?? prev);
        onMudou?.();
      })
      .catch((e) => {
        setItens((prev) => prev?.filter((i) => i.id !== provisorio.id) ?? prev);
        setErro(e?.message || "Não consegui adicionar.");
      });
  }

  function alternar(item: ItemDia) {
    const feito = !item.feito;
    setItens((prev) => prev?.map((i) => (i.id === item.id ? { ...i, feito } : i)) ?? prev);
    fetch("/api/dia", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, feito }),
    })
      .then(() => onMudou?.())
      .catch(() => {
        setItens((prev) => prev?.map((i) => (i.id === item.id ? { ...i, feito: item.feito } : i)) ?? prev);
      });
  }

  function remover(item: ItemDia) {
    setItens((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
    fetch(`/api/dia?id=${item.id}`, { method: "DELETE" })
      .then(() => onMudou?.())
      .catch(() => setItens((prev) => (prev ? [...prev, item] : prev)));
  }

  if (itens === null) return <p className="px-2 py-2 text-sm text-muted">{erro ?? "Carregando…"}</p>;

  const sugestoesRestantes = sugestoes.filter((s) => !itens.some((i) => i.texto === s));

  return (
    <div>
      <ul className="flex flex-col">
        {itens.map((item) => (
          <li key={item.id} className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <Check label={item.texto} feito={item.feito} onToggle={() => alternar(item)} />
            </div>
            <button
              type="button"
              onClick={() => remover(item)}
              aria-label={`Remover ${item.texto}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
            >
              <IconeFechar />
            </button>
          </li>
        ))}
        {itens.length === 0 && <li className="px-2 py-2 text-sm text-muted">Nada ainda. Escreva o que você precisa fazer.</li>}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          adicionar(novo);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="O que fazer"
          autoComplete="off"
          className="campo min-w-0 flex-1"
        />
        <button type="submit" className="botao">
          Adicionar
        </button>
      </form>

      {sugestoesRestantes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {sugestoesRestantes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => adicionar(s)}
              className="rounded-full bg-black/[0.05] px-2.5 py-1 text-xs text-muted hover:bg-black/[0.08]"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {erro && <p className="mt-2 px-2 text-sm text-danger">{erro}</p>}
    </div>
  );
}
