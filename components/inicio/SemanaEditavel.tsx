"use client";

import { useState } from "react";
import type { LinhaSemana } from "@/lib/rotina";

type Campo = "manha" | "noite";

function Celula({
  linha,
  campo,
  onSalvar,
}: {
  linha: LinhaSemana;
  campo: Campo;
  onSalvar: (ordem: number, campo: Campo, valor: string) => void;
}) {
  return (
    <td className="p-0">
      <input
        defaultValue={linha[campo]}
        aria-label={`${linha.dia}, ${campo === "manha" ? "manhã" : "noite"}`}
        onBlur={(e) => onSalvar(linha.ordem, campo, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = linha[campo];
            e.currentTarget.blur();
          }
        }}
        className="w-full rounded-lg bg-transparent px-3 py-2.5 text-[0.94rem] text-foreground/90 hover:bg-black/[0.03] focus:bg-primary-soft/70 focus:outline-none"
      />
    </td>
  );
}

// Tabela da semana: cada célula de manhã/noite é editável no lugar.
// Enter ou sair do campo salva; Esc desfaz.
export function SemanaEditavel({ linhasIniciais }: { linhasIniciais: LinhaSemana[] }) {
  const [linhas, setLinhas] = useState(linhasIniciais);
  const [erro, setErro] = useState<string | null>(null);

  function salvar(ordem: number, campo: Campo, valor: string) {
    const anterior = linhas.find((l) => l.ordem === ordem)?.[campo];
    const final = valor.trim() || "—";
    if (final === anterior) return;
    setLinhas((prev) => prev.map((l) => (l.ordem === ordem ? { ...l, [campo]: final } : l)));
    fetch("/api/semana", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem, campo, valor: final }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        setErro(null);
      })
      .catch(() => {
        setLinhas((prev) => prev.map((l) => (l.ordem === ordem ? { ...l, [campo]: anterior ?? "—" } : l)));
        setErro("Não consegui salvar a semana. Tente de novo.");
      });
  }

  return (
    <section aria-labelledby="titulo-semana" className="painel p-5">
      <h2 id="titulo-semana" className="px-2 text-lg font-semibold">
        Semana
      </h2>
      <p className="mt-0.5 px-2 text-sm text-muted">Toque numa célula para mudar.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium text-muted">
              <th className="w-16 px-3 py-2 font-medium">Dia</th>
              <th className="px-3 py-2 font-medium">Manhã</th>
              <th className="px-3 py-2 font-medium">Noite</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.ordem} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-2.5 text-[0.94rem] font-semibold">
                  {l.dia}
                </th>
                <Celula linha={l} campo="manha" onSalvar={salvar} />
                <Celula linha={l} campo="noite" onSalvar={salvar} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}
    </section>
  );
}
