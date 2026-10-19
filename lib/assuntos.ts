// Lista fixa dos assuntos que o usuário estuda no momento. Isso não é
// "estrutura por antecipação" (regra do ANTIRGAVITY.md) porque não é
// palpite — é uma lista real, escolhida pelo usuário. Vive só como filtro
// (campo `assunto` no frontmatter), não move nenhum arquivo de lugar.
export const ASSUNTOS = [
  "Engenharia de Software",
  "IA",
  "Inglês",
  "Empreendedorismo",
  "Oratória",
] as const;
