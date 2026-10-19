import path from "node:path";

// O Next.js roda com cwd = frontend/. O wiki vive em segundo-celebro/, uma
// pasta separada do código — assim o cofre do Obsidian não mistura com
// frontend/node_modules quando você abre segundo-celebro/ como vault.
// Só o sincronizador (scripts/sincronizar.ts) escreve aí; o app usa o banco.
export const WIKI_ROOT = path.resolve(process.cwd(), "..", "segundo-celebro");
export const RAW_DIR = path.join(WIKI_ROOT, "raw");
export const RAW_ASSETS_DIR = path.join(RAW_DIR, "assets");
