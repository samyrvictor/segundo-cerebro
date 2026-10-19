// Colunas e áreas do Quadro (kanban) — fixas, como no CRM do Sanc. Arquivo sem
// acesso ao banco para poder ser usado também nos componentes do navegador.
export const COLUNAS = [
  { id: "a_fazer", nome: "A fazer" },
  { id: "fazendo", nome: "Fazendo" },
  { id: "feito", nome: "Feito" },
] as const;

export const AREAS = [
  { id: "estudo", nome: "Estudo" },
  { id: "trabalho", nome: "Trabalho" },
  { id: "pessoal", nome: "Pessoal" },
] as const;

export type Coluna = (typeof COLUNAS)[number]["id"];
export type Area = (typeof AREAS)[number]["id"];

export interface Tarefa {
  id: number;
  titulo: string;
  coluna: Coluna;
  area: Area | null;
  ordem: number;
}

export const colunaValida = (c: unknown): c is Coluna => COLUNAS.some((x) => x.id === c);
export const areaValida = (a: unknown): a is Area => AREAS.some((x) => x.id === a);
