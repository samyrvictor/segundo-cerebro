// Nomes que nunca podem virar o slug de uma fonte — o Claude Code carrega
// CLAUDE.md/AGENTS.md automaticamente como instruções (mesmo aninhado), e um
// favorito/nota poderia colidir com esse nome sem querer (ex.: um bookmark
// pro claude.ai vira slug "claude").
const NOMES_RESERVADOS = new Set(["claude", "agents", "antirgavity", "readme", "index", "log"]);

export function slugify(text: string): string {
  const withoutAccents = text.normalize("NFD").replace(/\p{M}/gu, "");

  const slug = withoutAccents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  if (!slug) return "fonte";
  return NOMES_RESERVADOS.has(slug) ? `${slug}-fonte` : slug;
}
