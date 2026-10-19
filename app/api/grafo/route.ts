import path from "node:path";
import { db, ok } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

// Pontos = notas; ligações = [[links]] entre elas. O alvo de [[nome]] é o nome
// do arquivo (como no Obsidian), sem diferenciar maiúsculas.
export async function GET() {
  const fontes = ok(await db().from("fontes").select("slug, caminho, titulo, plataforma, markdown"));

  const porNome = new Map<string, string>();
  for (const f of fontes) {
    porNome.set(path.posix.basename(f.caminho, ".md").toLowerCase(), f.slug);
    porNome.set(f.slug, f.slug);
  }

  const arestas = new Set<string>();
  for (const f of fontes) {
    const semCodigo = (f.markdown as string).replace(/```[\s\S]*?```/g, "");
    for (const m of semCodigo.matchAll(/\[\[([^\]|#]+)/g)) {
      const nome = m[1].trim();
      const alvo = porNome.get(nome.toLowerCase()) ?? porNome.get(slugify(nome));
      if (alvo && alvo !== f.slug) arestas.add([f.slug, alvo].sort().join("\u0000"));
    }
  }

  return Response.json({
    nos: fontes.map((f) => ({ slug: f.slug, titulo: f.titulo, plataforma: f.plataforma })),
    arestas: [...arestas].map((a) => a.split("\u0000")),
  });
}
