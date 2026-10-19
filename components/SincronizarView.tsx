"use client";

import { useEffect, useState } from "react";

interface Status {
  obsidian: string | null;
  notion: { conectado: boolean; workspace: string | null; ultima: string | null };
  chrome: { ultima: string | null; disponivel: boolean };
}

const FORMATO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function haQuanto(iso: string): string {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora há pouco";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return `em ${FORMATO.format(new Date(iso))}`;
}

// Lê a resposta em linhas (NDJSON) das rotas de sincronização do Notion e do Chrome.
function useSincronizacao(url: string, aoTerminar: () => void) {
  const [linhas, setLinhas] = useState<string[]>([]);
  const [rodando, setRodando] = useState(false);

  async function rodar() {
    setRodando(true);
    setLinhas([]);
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.body) throw new Error("Sem resposta do servidor.");
      const leitor = res.body.getReader();
      const decodificador = new TextDecoder();
      let resto = "";
      for (;;) {
        const { value, done } = await leitor.read();
        if (done) break;
        resto += decodificador.decode(value, { stream: true });
        const partes = resto.split("\n");
        resto = partes.pop() ?? "";
        for (const parte of partes.filter((p) => p.trim())) {
          const evento = JSON.parse(parte);
          if (evento.type === "step") setLinhas((prev) => [...prev, evento.message]);
          if (evento.type === "error") setLinhas((prev) => [...prev, `Erro: ${evento.message}`]);
          if (evento.type === "done") {
            const d = evento.data;
            setLinhas((prev) => [
              ...prev,
              `Pronto: ${d.novas} novas, ${d.existentes} já estavam${d.semConteudo ? `, ${d.semConteudo} vazias no Notion` : ""}${
                d.falhas ? `, ${d.falhas} não deu para buscar` : ""
              }.`,
            ]);
            aoTerminar();
          }
        }
      }
    } catch (err) {
      setLinhas((prev) => [...prev, `Erro: ${err instanceof Error ? err.message : "falha desconhecida"}`]);
    } finally {
      setRodando(false);
    }
  }

  return { linhas, rodando, rodar };
}

function Registro({ linhas }: { linhas: string[] }) {
  if (linhas.length === 0) return null;
  return (
    <ol className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-black/[0.04] px-3 py-2 text-xs leading-relaxed text-muted" aria-live="polite">
      {linhas.map((l, i) => (
        <li key={i} className={l.startsWith("Erro:") ? "text-danger" : l.startsWith("Pronto:") ? "text-foreground" : undefined}>
          {l}
        </li>
      ))}
    </ol>
  );
}

function Secao({ titulo, estado, children }: { titulo: string; estado: string; children: React.ReactNode }) {
  return (
    <section className="painel p-6" aria-label={titulo}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">{titulo}</h2>
        <p className="text-sm text-muted">{estado}</p>
      </div>
      {children}
    </section>
  );
}

const botao =
  "botao mt-4";

export function SincronizarView({ aviso }: { aviso: { erro?: string; conectado?: boolean } }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [versao, setVersao] = useState(0);
  const recarregar = () => setVersao((v) => v + 1);
  const notion = useSincronizacao("/api/sync-notion", recarregar);
  const chrome = useSincronizacao("/api/sync-chrome", recarregar);

  useEffect(() => {
    fetch("/api/sincronizar/status")
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => {});
  }, [versao]);

  function desconectarNotion() {
    if (!confirm("Desconectar o Notion? Você pode conectar de novo quando quiser.")) return;
    fetch("/api/notion/oauth/disconnect", { method: "POST" }).finally(recarregar);
  }

  return (
    <div className="mt-8 flex flex-col gap-5">
      {aviso.erro && <p className="mb-6 text-sm text-danger">Não consegui conectar o Notion: {aviso.erro}</p>}
      {aviso.conectado && <p className="mb-6 text-sm text-primary-strong">Notion conectado.</p>}

      <Secao
        titulo="Obsidian"
        estado={status ? (status.obsidian ? `Atualizado ${haQuanto(status.obsidian)}` : "Ainda não sincronizado") : "…"}
      >
        <p className="mt-2 max-w-xl text-sm text-muted">
          O sincronizador roda no seu PC: tudo que muda aqui vai para a pasta <code>segundo-celebro/</code>, e o que você
          escreve no Obsidian volta para o app e para a busca. Para rodar na hora, dentro de <code>frontend/</code>:
        </p>
        <pre className="mt-3 w-fit rounded-lg bg-black/[0.04] px-3 py-2 text-sm">npm run sincronizar</pre>
      </Secao>

      <Secao
        titulo="Notion"
        estado={
          status
            ? status.notion.conectado
              ? `Conectado${status.notion.workspace ? ` a ${status.notion.workspace}` : ""}${
                  status.notion.ultima ? `, última vez em ${status.notion.ultima}` : ""
                }`
              : "Não conectado"
            : "…"
        }
      >
        <p className="mt-2 max-w-xl text-sm text-muted">
          Traz o conteúdo puro da área &ldquo;Sanc / Ideias e Anotações&rdquo;, sem resumo de IA.
        </p>
        {status?.notion.conectado ? (
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={notion.rodar} disabled={notion.rodando} className={botao}>
              {notion.rodando ? "Sincronizando…" : "Sincronizar Notion"}
            </button>
            <button type="button" onClick={desconectarNotion} className="mt-4 text-sm text-muted hover:text-danger">
              Desconectar
            </button>
          </div>
        ) : (
          <a href="/api/notion/oauth/start" className={`${botao} inline-block`}>
            Conectar com Notion
          </a>
        )}
        <Registro linhas={notion.linhas} />
      </Secao>

      <Secao
        titulo="Favoritos do Chrome"
        estado={status ? (status.chrome.ultima ? `Última vez em ${status.chrome.ultima}` : "Ainda não sincronizado") : "…"}
      >
        <p className="mt-2 max-w-xl text-sm text-muted">
          Cada favorito da barra vira uma nota com o conteúdo da página.
          {status && !status.chrome.disponivel && " Só funciona com o app aberto no seu PC (npm run dev), porque precisa ler o seu Chrome."}
        </p>
        <button type="button" onClick={chrome.rodar} disabled={chrome.rodando || (status ? !status.chrome.disponivel : true)} className={botao}>
          {chrome.rodando ? "Sincronizando…" : "Sincronizar favoritos"}
        </button>
        <Registro linhas={chrome.linhas} />
      </Secao>
    </div>
  );
}
