"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Fonte {
  slug: string;
  titulo: string;
  plataforma: string;
  data_ingestao: string | null;
}

// Lista das notas que entraram por último no cérebro (de qualquer origem).
export function FontesRecentes() {
  const [fontes, setFontes] = useState<Fonte[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/fontes")
      .then((res) => res.json())
      .then((data) => setFontes(data.fontes ?? []))
      .catch(() => {
        // silencioso — a lista recente é um bônus, não bloqueia o resto da tela
      })
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return <p className="mt-3 text-sm text-muted">Carregando…</p>;
  }

  if (fontes.length === 0) {
    return <p className="mt-3 text-sm text-muted">Nada ainda. Cole um texto ou link na aba Texto.</p>;
  }

  return (
    <ul className="mt-2">
      {fontes.map((fonte) => (
        <li key={fonte.slug} className="border-b border-border last:border-0">
          <Link href={`/nota/${fonte.slug}`} className="group flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <span className="group-hover:text-primary-strong">{fonte.titulo}</span>
            <span className="shrink-0 text-xs text-muted">
              {fonte.plataforma}, {fonte.data_ingestao}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
