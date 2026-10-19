export interface SemanaIngles {
  numero: number;
  tema: string;
  gramatica: { titulo: string; explicacao: string; exemplos: string[] };
  // [inglês, português] — 70 por semana
  vocab: [string, string][];
  recursos: string[];
  input: string;
  shadowing: string;
  escrita: string;
  roleplay: string;
  microHabito: string;
}

export interface BlocoDia {
  atividade: string;
  recurso: string;
  minutos: number;
}

export interface DiaIngles {
  id: string; // ex.: S01D3
  numero: number; // 1..7
  curto: string; // rótulo curto do foco (Input, Shadowing...)
  foco: string;
  blocos: BlocoDia[];
}
