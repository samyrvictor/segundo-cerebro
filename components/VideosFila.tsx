"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Video {
  id: number;
  url: string;
  assunto: string | null;
  status: "pendente" | "feito" | "erro";
  erro: string | null;
  slug: string | null;
}

const ROTULO = { pendente: "pendente", feito: "transcrito", erro: "erro" } as const;

// `versao` muda quando um vídeo novo entra pela caixa de texto → recarrega.
export function VideosFila({ versao }: { versao: number }) {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => setVideos(data.videos ?? []))
      .catch(() => {});
  }, [versao]);

  function remover(id: number) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    fetch(`/api/videos?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  if (videos.length === 0) return null;

  return (
    <section className="painel p-6">
      <p className="text-sm font-medium">Fila de vídeos</p>
      <p className="mt-1 text-xs text-muted">
        No PC, peça ao Claude Code: &ldquo;processa os vídeos pendentes&rdquo;.
      </p>
      <ul className="mt-3 flex flex-col divide-y divide-border">
        {videos.map((v) => (
          <li key={v.id} className="flex items-center gap-3 py-2 text-sm">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                v.status === "erro" ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary-strong"
              }`}
            >
              {ROTULO[v.status]}
            </span>
            {v.status === "feito" && v.slug ? (
              <Link href={`/nota/${v.slug}`} className="min-w-0 flex-1 truncate hover:text-primary">
                {v.url}
              </Link>
            ) : (
              <a href={v.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:text-primary">
                {v.url}
              </a>
            )}
            {v.erro && <span className="hidden truncate text-xs text-danger sm:inline">{v.erro}</span>}
            <button type="button" onClick={() => remover(v.id)} className="shrink-0 text-xs text-muted hover:text-danger">
              remover
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
