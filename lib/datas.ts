// Datas no fuso local (YYYY-MM-DD) — toISOString() usaria UTC e trocaria o
// dia depois das 21h no horário de Brasília.
export function isoLocal(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// "Hoje" sempre no horário de Brasília — o servidor da Vercel roda em UTC e,
// depois das 21h, já estaria no dia seguinte. Mesmo resultado no servidor e no
// navegador (evita a tela mudar de data ao carregar).
const DIA_SAO_PAULO = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

export function hojeISO(): string {
  return DIA_SAO_PAULO.format(new Date());
}

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
