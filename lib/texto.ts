// Comparação de texto sem acento e sem maiúsculas, mantendo 1 caractere
// normalizado por caractere original — assim a posição achada no texto
// normalizado vale também no original (para recortar trechos e destacar).

export function normalizar(texto: string): string {
  let saida = "";
  for (const c of texto) saida += (c.normalize("NFD")[0] ?? c).toLowerCase();
  return saida;
}

// Palavras da busca, já normalizadas (ignora sinais soltos).
export function termosDaBusca(q: string): string[] {
  return normalizar(q)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((p) => p.length > 0);
}

export function contar(texto: string, termo: string): number {
  if (!termo) return 0;
  return normalizar(texto).split(termo).length - 1;
}

// Trecho de ~`tamanho` caracteres em volta do primeiro termo encontrado.
export function trechoEmVolta(texto: string, termos: string[], tamanho = 180): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const norm = normalizar(limpo);
  const idx = termos.map((t) => norm.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1;
  if (idx === -1) return limpo.slice(0, tamanho) + (limpo.length > tamanho ? "…" : "");
  const inicio = Math.max(0, idx - tamanho / 3);
  const fim = Math.min(limpo.length, inicio + tamanho);
  return `${inicio > 0 ? "…" : ""}${limpo.slice(inicio, fim).trim()}${fim < limpo.length ? "…" : ""}`;
}

// Divide o texto em partes marcadas/não marcadas para destacar os termos.
export function partesDestacadas(texto: string, termos: string[]): { texto: string; marcado: boolean }[] {
  const norm = normalizar(texto);
  const marcas = new Array<boolean>(texto.length).fill(false);
  for (const termo of termos) {
    for (let i = norm.indexOf(termo); i !== -1; i = norm.indexOf(termo, i + termo.length)) {
      for (let j = i; j < i + termo.length; j++) marcas[j] = true;
    }
  }
  const partes: { texto: string; marcado: boolean }[] = [];
  const chars = [...texto];
  chars.forEach((c, i) => {
    const ultima = partes.at(-1);
    if (ultima && ultima.marcado === marcas[i]) ultima.texto += c;
    else partes.push({ texto: c, marcado: marcas[i] });
  });
  return partes;
}
