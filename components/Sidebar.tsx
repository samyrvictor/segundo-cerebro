"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const ITENS = [
  { href: "/", label: "Início", icon: IconeInicio },
  { href: "/rotina", label: "Rotina", icon: IconeRotina },
  { href: "/quadro", label: "Quadro", icon: IconeQuadro },
  { href: "/pomodoro", label: "Pomodoro", icon: IconePomodoro },
  { href: "/ingles", label: "Inglês", icon: IconeIngles },
  { href: "/estudos", label: "Estudos", icon: IconeEstudos },
  { href: "/buscar", label: "Buscar", icon: IconeBuscar },
  { href: "/grafo", label: "Grafo", icon: IconeGrafo },
  { href: "/texto", label: "Texto", icon: IconeTexto },
  { href: "/sincronizar", label: "Sincronizar", icon: IconeSincronizar },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Ctrl+K (ou Cmd+K) abre a busca de qualquer tela.
  useEffect(() => {
    function atalho(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/buscar");
      }
    }
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, [router]);

  if (pathname === "/login") return null;

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <aside className="sticky top-0 z-10 flex h-screen w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg px-2 py-7 text-sidebar-fg backdrop-blur-xl backdrop-saturate-150 md:w-60 md:px-3">
      <Link href="/" className="hidden px-3 text-[1.05rem] font-semibold tracking-tight md:block">
        Segundo Cérebro
      </Link>

      <nav className="mt-7 flex flex-col gap-0.5">
        {ITENS.map((item) => {
          const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={ativo ? "page" : undefined}
              className={`flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-[0.88rem] md:justify-start ${
                ativo ? "bg-sidebar-active-bg font-semibold text-primary-strong" : "text-sidebar-fg/85 hover:bg-black/[0.04] hover:text-sidebar-fg"
              }`}
            >
              <Icon />
              <span className="hidden md:inline">{item.label}</span>
              {item.href === "/buscar" && (
                <kbd className="ml-auto hidden rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-sidebar-muted md:inline">
                  Ctrl K
                </kbd>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={sair}
        className="mt-auto rounded-lg px-3 py-2 text-left text-xs text-sidebar-muted hover:bg-black/[0.04] hover:text-sidebar-fg"
      >
        Sair
      </button>
    </aside>
  );
}

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconeInicio() {
  return (
    <IconBase>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" />
    </IconBase>
  );
}

function IconeRotina() {
  return (
    <IconBase>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </IconBase>
  );
}

function IconeQuadro() {
  return (
    <IconBase>
      <rect x="3.5" y="4" width="5" height="16" rx="1.2" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.2" />
      <rect x="15.5" y="4" width="5" height="7" rx="1.2" />
    </IconBase>
  );
}

function IconePomodoro() {
  return (
    <IconBase>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 10v3.5l2.2 1.6" />
      <path d="M9.5 3.5h5" />
      <path d="M12 3.5v3" />
    </IconBase>
  );
}

function IconeIngles() {
  return (
    <IconBase>
      <path d="M4 5h8" />
      <path d="M8 3v2" />
      <path d="M5.5 5c.5 3 2.5 5.5 5 7" />
      <path d="M10.5 5c-.5 3-2.5 5.5-5 7" />
      <path d="m12 20 4-9 4 9" />
      <path d="M13.5 17h5" />
    </IconBase>
  );
}

function IconeEstudos() {
  return (
    <IconBase>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </IconBase>
  );
}

function IconeBuscar() {
  return (
    <IconBase>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </IconBase>
  );
}

function IconeGrafo() {
  return (
    <IconBase>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="12" cy="17" r="2.2" />
      <path d="M8 8.2 10.8 15" />
      <path d="M16.3 7.6 13.3 15.2" />
      <path d="M8.2 6.8h7.6" />
    </IconBase>
  );
}

function IconeTexto() {
  return (
    <IconBase>
      <path d="M5 5.5h14" />
      <path d="M5 10.5h14" />
      <path d="M5 15.5h9" />
    </IconBase>
  );
}

function IconeSincronizar() {
  return (
    <IconBase>
      <path d="M19.5 9A7.5 7.5 0 0 0 6 6.5L4.5 8" />
      <path d="M4.5 4v4h4" />
      <path d="M4.5 15A7.5 7.5 0 0 0 18 17.5l1.5-1.5" />
      <path d="M19.5 20v-4h-4" />
    </IconBase>
  );
}
