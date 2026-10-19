// Legenda de vídeo do YouTube lida direto pelo servidor, sem baixar o vídeo.
// Quando o YouTube bloqueia (desconfia de servidor) ou o vídeo não tem
// legenda, quem chama manda o vídeo para a fila do PC (/watch).
// Caminho: API "player" do YouTube com o cliente ANDROID → arquivo da legenda.
// (A página /watch costuma devolver "não sou um robô"; a API direta não.)

const CLIENTE_ANDROID = {
  "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};

export function idDoYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
    if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (host !== "youtube.com") return null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    return u.pathname.match(/^\/(shorts|live|embed)\/([\w-]{11})/)?.[2] ?? null;
  } catch {
    return null;
  }
}

interface Faixa {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" = legenda automática
}

// Transcrição = o que é falado: prefere a legenda do autor no idioma falado no
// vídeo (o idioma da legenda automática); depois português, inglês e, por fim,
// a automática.
function escolherFaixa(faixas: Faixa[]): Faixa | undefined {
  const falado = faixas.find((f) => f.kind === "asr")?.languageCode.split("-")[0];
  const pontuar = (f: Faixa) => {
    if (f.kind === "asr") return 1;
    const idioma = f.languageCode.split("-")[0];
    return idioma === falado ? 20 : idioma === "pt" ? 12 : idioma === "en" ? 11 : 5;
  };
  return [...faixas].sort((a, b) => pontuar(b) - pontuar(a))[0];
}

function decodificar(texto: string): string {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "");
}

export async function legendaDoYoutube(id: string): Promise<{ titulo: string; texto: string }> {
  const resposta = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { ...CLIENTE_ANDROID, "Content-Type": "application/json" },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 34, hl: "pt", gl: "BR" } },
      videoId: id,
    }),
  });
  if (!resposta.ok) throw new Error(`O YouTube recusou a leitura (HTTP ${resposta.status}).`);
  const player = await resposta.json();

  const status = player?.playabilityStatus?.status;
  if (status && status !== "OK") throw new Error(`Vídeo indisponível para leitura (${status}).`);

  const faixas: Faixa[] = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const faixa = escolherFaixa(faixas);
  if (!faixa) throw new Error("Esse vídeo não tem legenda.");

  const xml = await fetch(faixa.baseUrl.replace("&fmt=srv3", ""), { headers: CLIENTE_ANDROID }).then((r) => r.text());
  const falas = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => decodificar(m[1]).replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (falas.length === 0) throw new Error("A legenda veio vazia.");

  // Parágrafos de ~8 falas, para a nota ficar legível no Obsidian.
  const paragrafos: string[] = [];
  for (let i = 0; i < falas.length; i += 8) paragrafos.push(falas.slice(i, i + 8).join(" "));

  const titulo = (player?.videoDetails?.title as string | undefined) ?? `Vídeo do YouTube ${id}`;
  const fonte = faixa.kind === "asr" ? "legenda automática" : "legenda do autor";
  return { titulo, texto: `Transcrição (${fonte}, ${faixa.languageCode}):\n\n${paragrafos.join("\n\n")}` };
}
