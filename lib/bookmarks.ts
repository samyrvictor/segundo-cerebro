import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface PastaFavoritos {
  nome: string;
  links: { titulo: string; url: string }[];
  subpastas: PastaFavoritos[];
}

interface NoBruto {
  type: "folder" | "url";
  name: string;
  url?: string;
  children?: NoBruto[];
}

// Perfil "Default" é onde a barra de favoritos do usuário vive neste PC.
// Se um dia isso rodar em outra máquina, dá pra trocar via CHROME_PROFILE_DIR.
function caminhoBookmarks(): string {
  const perfil = process.env.CHROME_PROFILE_DIR ?? "Default";
  return path.join(
    os.homedir(),
    "AppData",
    "Local",
    "Google",
    "Chrome",
    "User Data",
    perfil,
    "Bookmarks"
  );
}

function converter(no: NoBruto): PastaFavoritos {
  const links: PastaFavoritos["links"] = [];
  const subpastas: PastaFavoritos[] = [];

  for (const filho of no.children ?? []) {
    if (filho.type === "folder") {
      subpastas.push(converter(filho));
    } else if (filho.type === "url" && filho.url && !filho.url.startsWith("chrome://")) {
      links.push({ titulo: filho.name, url: filho.url });
    }
  }

  return { nome: no.name, links, subpastas };
}

// Lê a barra de favoritos do Chrome (só a bookmark bar, não o resto do
// gerenciador de favoritos) e devolve a árvore de pastas/links.
export async function lerBarraDeFavoritos(): Promise<PastaFavoritos[]> {
  const arquivo = caminhoBookmarks();
  let bruto: string;
  try {
    bruto = await fs.readFile(arquivo, "utf-8");
  } catch {
    throw new Error(
      `Não encontrei os favoritos do Chrome em ${arquivo}. Feche o Chrome e tente de novo, ou defina CHROME_PROFILE_DIR em .env.local.`
    );
  }

  const dados = JSON.parse(bruto);
  const barra: NoBruto | undefined = dados?.roots?.bookmark_bar;
  if (!barra) {
    throw new Error("Não encontrei a barra de favoritos nesse perfil do Chrome.");
  }

  return (barra.children ?? []).map(converter);
}
