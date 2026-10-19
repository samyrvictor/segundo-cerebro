import type { ReactNode } from "react";

// Ícones pequenos de interface, no mesmo traço da barra lateral (no lugar de ✕ ⋯ ‹ ›).
function Icone({ children, tamanho = 16 }: { children: ReactNode; tamanho?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export function IconeFechar() {
  return (
    <Icone tamanho={14}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icone>
  );
}

export function IconeOpcoes() {
  return (
    <Icone>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </Icone>
  );
}

export function IconeAnterior() {
  return (
    <Icone>
      <path d="m15 6-6 6 6 6" />
    </Icone>
  );
}

export function IconeProximo() {
  return (
    <Icone>
      <path d="m9 6 6 6-6 6" />
    </Icone>
  );
}
