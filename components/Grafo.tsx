"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

interface No extends SimulationNodeDatum {
  slug: string;
  titulo: string;
  plataforma: string;
  grau: number;
}

type Ligacao = SimulationLinkDatum<No>;

// Cores por origem: o que você escreveu em laranja; o que veio de fora em tons neutros.
const GRUPOS: { nome: string; cor: string; casa: (p: string) => boolean }[] = [
  { nome: "Escrito por você", cor: "#ff5a1f", casa: (p) => p === "texto colado" || p === "obsidian" },
  { nome: "Notion", cor: "#1d1a17", casa: (p) => p === "notion" },
  { nome: "GitHub", cor: "#7a5cc7", casa: (p) => p === "github" },
  { nome: "PDF e Docs", cor: "#2f6b45", casa: (p) => p === "pdf" || p === "google docs" },
  { nome: "Sites e vídeos", cor: "#a39a90", casa: () => true },
];

const corDe = (plataforma: string) => GRUPOS.find((g) => g.casa(plataforma))!.cor;
const raioDe = (n: No) => 3.5 + Math.sqrt(n.grau) * 2.2;

export function Grafo() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">("carregando");
  const [contagem, setContagem] = useState({ nos: 0, arestas: 0 });
  const [filtro, setFiltro] = useState("");
  const [lista, setLista] = useState<{ slug: string; titulo: string; grau: number }[]>([]);
  const filtroRef = useRef("");
  const redesenharRef = useRef<() => void>(() => {});

  useEffect(() => {
    filtroRef.current = filtro.toLowerCase();
    redesenharRef.current();
  }, [filtro]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let nos: No[] = [];
    let ligacoes: Ligacao[] = [];
    const vizinhos = new Map<string, Set<string>>();
    let vista = { x: 0, y: 0, k: 1 };
    let sobre: No | null = null;
    let arrastandoNo: No | null = null;
    let arrastandoFundo: { x: number; y: number } | null = null;
    let moveu = false;
    let largura = 0;
    let altura = 0;
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fonte = getComputedStyle(canvas).fontFamily || "sans-serif";

    const simulacao = forceSimulation<No>()
      .force("carga", forceManyBody<No>().strength(-70))
      .force("centro", forceCenter(0, 0))
      .force("colisao", forceCollide<No>().radius((n) => raioDe(n) + 3))
      .on("tick", desenhar);

    function desenhar() {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, largura, altura);
      ctx.translate(largura / 2 + vista.x, altura / 2 + vista.y);
      ctx.scale(vista.k, vista.k);

      const busca = filtroRef.current;
      const foco = sobre ? vizinhos.get(sobre.slug) : null;
      const apagado = (n: No) =>
        (foco && n !== sobre && !foco.has(n.slug)) || (busca && !n.titulo.toLowerCase().includes(busca));

      ctx.lineWidth = 1 / vista.k;
      for (const l of ligacoes) {
        const a = l.source as No;
        const b = l.target as No;
        const ativa = sobre && (a === sobre || b === sobre);
        ctx.strokeStyle = ativa ? "rgba(255,90,31,0.7)" : foco || busca ? "rgba(29,26,23,0.05)" : "rgba(29,26,23,0.16)";
        ctx.beginPath();
        ctx.moveTo(a.x!, a.y!);
        ctx.lineTo(b.x!, b.y!);
        ctx.stroke();
      }

      for (const n of nos) {
        ctx.globalAlpha = apagado(n) ? 0.15 : 1;
        ctx.fillStyle = corDe(n.plataforma);
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, raioDe(n), 0, Math.PI * 2);
        ctx.fill();
      }

      // Rótulos: com zoom, no ponto em foco e nos vizinhos dele, e nos achados pela busca.
      ctx.font = `${12 / vista.k}px ${fonte}`;
      ctx.textAlign = "center";
      for (const n of nos) {
        const mostrar = n === sobre || foco?.has(n.slug) || (busca && !apagado(n)) || (vista.k > 1.6 && !apagado(n));
        if (!mostrar) continue;
        ctx.globalAlpha = 1;
        ctx.fillStyle = n === sobre ? "#1d1a17" : "rgba(29,26,23,0.75)";
        const texto = n.titulo.length > 40 ? `${n.titulo.slice(0, 38)}…` : n.titulo;
        ctx.fillText(texto, n.x!, n.y! + raioDe(n) + 13 / vista.k);
      }
      ctx.globalAlpha = 1;
    }
    redesenharRef.current = desenhar;

    function ajustarTamanho() {
      const caixa = canvas.getBoundingClientRect();
      largura = caixa.width;
      altura = caixa.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      desenhar();
    }
    const observador = new ResizeObserver(ajustarTamanho);
    observador.observe(canvas);

    function noNoPonto(px: number, py: number): No | null {
      const x = (px - largura / 2 - vista.x) / vista.k;
      const y = (py - altura / 2 - vista.y) / vista.k;
      for (let i = nos.length - 1; i >= 0; i--) {
        const n = nos[i];
        if ((n.x! - x) ** 2 + (n.y! - y) ** 2 <= (raioDe(n) + 4) ** 2) return n;
      }
      return null;
    }

    function posicao(e: PointerEvent | WheelEvent) {
      const caixa = canvas.getBoundingClientRect();
      return { px: e.clientX - caixa.left, py: e.clientY - caixa.top };
    }

    function aoApertar(e: PointerEvent) {
      const { px, py } = posicao(e);
      moveu = false;
      arrastandoNo = noNoPonto(px, py);
      if (arrastandoNo) {
        arrastandoNo.fx = arrastandoNo.x;
        arrastandoNo.fy = arrastandoNo.y;
        simulacao.alphaTarget(0.25).restart();
      } else {
        arrastandoFundo = { x: px - vista.x, y: py - vista.y };
      }
      canvas.setPointerCapture(e.pointerId);
    }

    function aoMover(e: PointerEvent) {
      const { px, py } = posicao(e);
      if (arrastandoNo) {
        moveu = true;
        arrastandoNo.fx = (px - largura / 2 - vista.x) / vista.k;
        arrastandoNo.fy = (py - altura / 2 - vista.y) / vista.k;
      } else if (arrastandoFundo) {
        moveu = true;
        vista = { ...vista, x: px - arrastandoFundo.x, y: py - arrastandoFundo.y };
        desenhar();
      } else {
        const achado = noNoPonto(px, py);
        if (achado !== sobre) {
          sobre = achado;
          canvas.style.cursor = achado ? "pointer" : "grab";
          desenhar();
        }
      }
    }

    function aoSoltar() {
      if (arrastandoNo) {
        const clicado = arrastandoNo;
        arrastandoNo.fx = null;
        arrastandoNo.fy = null;
        simulacao.alphaTarget(0);
        if (!moveu) router.push(`/nota/${clicado.slug}`);
      }
      arrastandoNo = null;
      arrastandoFundo = null;
    }

    function aoRolar(e: WheelEvent) {
      e.preventDefault();
      const { px, py } = posicao(e);
      const k = Math.min(4, Math.max(0.25, vista.k * Math.exp(-e.deltaY * 0.0015)));
      // Zoom em volta do cursor.
      const cx = px - largura / 2;
      const cy = py - altura / 2;
      vista = { k, x: cx - ((cx - vista.x) * k) / vista.k, y: cy - ((cy - vista.y) * k) / vista.k };
      desenhar();
    }

    canvas.addEventListener("pointerdown", aoApertar);
    canvas.addEventListener("pointermove", aoMover);
    canvas.addEventListener("pointerup", aoSoltar);
    canvas.addEventListener("pointerleave", () => {
      sobre = null;
      desenhar();
    });
    canvas.addEventListener("wheel", aoRolar, { passive: false });

    fetch("/api/grafo")
      .then((res) => res.json())
      .then((data: { nos: Omit<No, "grau">[]; arestas: [string, string][] }) => {
        const grau = new Map<string, number>();
        for (const [a, b] of data.arestas) {
          grau.set(a, (grau.get(a) ?? 0) + 1);
          grau.set(b, (grau.get(b) ?? 0) + 1);
          vizinhos.set(a, (vizinhos.get(a) ?? new Set()).add(b));
          vizinhos.set(b, (vizinhos.get(b) ?? new Set()).add(a));
        }
        nos = data.nos.map((n) => ({ ...n, grau: grau.get(n.slug) ?? 0 }));
        const porSlug = new Map(nos.map((n) => [n.slug, n]));
        ligacoes = data.arestas.map(([a, b]) => ({ source: porSlug.get(a)!, target: porSlug.get(b)! }));
        simulacao.nodes(nos).force("ligacoes", forceLink<No, Ligacao>(ligacoes).distance(55).strength(0.6));
        if (reduzMovimento) {
          simulacao.stop();
          simulacao.tick(300);
          desenhar();
        } else {
          simulacao.alpha(1).restart();
        }
        setContagem({ nos: nos.length, arestas: ligacoes.length });
        setLista([...nos].sort((a, b) => b.grau - a.grau || a.titulo.localeCompare(b.titulo)));
        setEstado("pronto");
      })
      .catch(() => setEstado("erro"));

    return () => {
      simulacao.stop();
      observador.disconnect();
    };
  }, [router]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Destacar notas pelo título"
          aria-label="Destacar notas pelo título"
          className="campo w-full max-w-xs"
        />
        <p className="text-xs tabular-nums text-muted">
          {estado === "pronto" && `${contagem.nos} notas, ${contagem.arestas} ligações`}
          {estado === "carregando" && "Montando o grafo…"}
          {estado === "erro" && "Não consegui montar o grafo. Recarregue a página."}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Grafo das notas: cada ponto é uma nota e cada linha um [[link]] entre elas. Passe o mouse para ver o título e clique para abrir."
        className="painel mt-3 h-[70vh] w-full cursor-grab touch-none"
      />

      {lista.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted hover:text-foreground">Ver as notas como lista</summary>
          <ul className="mt-2 columns-1 gap-8 sm:columns-2">
            {lista
              .filter((n) => !filtro || n.titulo.toLowerCase().includes(filtro.toLowerCase()))
              .map((n) => (
                <li key={n.slug} className="break-inside-avoid py-1">
                  <Link href={`/nota/${n.slug}`} className="hover:text-primary-strong">
                    {n.titulo}
                  </Link>
                  {n.grau > 0 && <span className="ml-2 text-xs tabular-nums text-muted">{n.grau} ligações</span>}
                </li>
              ))}
          </ul>
        </details>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {GRUPOS.map((g) => (
          <li key={g.nome} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.cor }} />
            {g.nome}
          </li>
        ))}
      </ul>
      {estado === "pronto" && contagem.arestas === 0 && (
        <p className="mt-3 text-sm text-muted">
          Ainda não há ligações. Escreva <code className="rounded bg-black/[0.04] px-1">[[nome da nota]]</code> dentro de uma
          nota (no Obsidian ou no app) para ligar as duas.
        </p>
      )}
    </div>
  );
}
