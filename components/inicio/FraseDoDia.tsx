"use client";

import { useEffect, useRef, useState } from "react";
import { SEMANAS } from "@/lib/ingles/plano";

const TROCA_A_CADA_MS = 7000;

// Frases da semana atual do plano de inglês, trocando sozinhas — pra treinar
// o vocabulário só de bater o olho, sem precisar abrir a página de Inglês.
export function FraseDoDia() {
  const [frases, setFrases] = useState<[string, string][] | null>(null);
  const [indice, setIndice] = useState(0);
  const indiceRef = useRef(0);

  useEffect(() => {
    fetch("/api/ingles")
      .then((res) => res.json())
      .then((data) => {
        const feitos: string[] = data.feitos ?? [];
        const semana =
          SEMANAS.find((s) => s.frases?.length && !feitos.some((id) => id.startsWith(`S${String(s.numero).padStart(2, "0")}`))) ??
          [...SEMANAS].reverse().find((s) => s.frases?.length);
        setFrases(semana?.frases ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!frases || frases.length < 2) return;
    const id = setInterval(() => {
      indiceRef.current = (indiceRef.current + 1) % frases.length;
      setIndice(indiceRef.current);
    }, TROCA_A_CADA_MS);
    return () => clearInterval(id);
  }, [frases]);

  if (!frases || frases.length === 0) return null;

  const [en, pt] = frases[indice];

  return (
    <section aria-labelledby="titulo-frase-do-dia" className="painel p-5">
      <h2 id="titulo-frase-do-dia" className="px-2 text-lg font-semibold">
        Frase do dia
      </h2>
      <div key={indice} className="entrada mt-3 px-2 pb-1">
        <p className="text-xl font-semibold tracking-[-0.01em]">{en}</p>
        <p className="mt-1.5 text-[0.94rem] text-muted">{pt}</p>
      </div>
    </section>
  );
}
