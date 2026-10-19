"use client";

import { useEffect, useState } from "react";
import type { ItemDia } from "@/lib/dia";

// Mapa do ano inteiro (data -> itens daquele dia), pro calendário da Rotina.
export function useRotina(ano: number) {
  const [dias, setDias] = useState<Record<string, ItemDia[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    fetch(`/api/rotina?ano=${ano}`)
      .then((res) => res.json())
      .then((data) => setDias(data.dias ?? {}))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [ano, versao]);

  // Depois de mexer num dia específico (via ChecklistDia).
  const recarregar = () => setVersao((v) => v + 1);

  return { dias, carregando, recarregar };
}
