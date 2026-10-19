"use client";

import { createContext, useContext, useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";

// Pomodoro trazido do projeto "app de IA/pomodoro" (HTML/JS puro) para o app.
// Ajustes e contagem do dia ficam no aparelho (localStorage), como no original.
// O estado mora no PomodoroProvider, montado na raiz do layout — assim o
// relógio continua rodando (e avisa quando termina) mesmo navegando para
// outras abas, em vez de parar e voltar ao início quando a página /pomodoro
// desmonta.

type Modo = "focus" | "short" | "long";
interface Ajustes {
  focus: number;
  short: number;
  long: number;
  every: number;
  sound: boolean;
}

const PADRAO: Ajustes = { focus: 25, short: 5, long: 15, every: 4, sound: true };
const MODOS: { id: Modo; nome: string; frase: string }[] = [
  { id: "focus", nome: "Foco", frase: "Hora de focar." },
  { id: "short", nome: "Pausa curta", frase: "Respire um pouco." },
  { id: "long", nome: "Pausa longa", frase: "Descanso merecido." },
];
const CIRCUNFERENCIA = 2 * Math.PI * 148;

function ler<T>(chave: string, padrao: T): T {
  try {
    return JSON.parse(localStorage.getItem(chave) ?? "null") ?? padrao;
  } catch {
    return padrao;
  }
}

function guardar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // sem localStorage (aba anônima): só não guarda
  }
}

const formatar = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Toca os 3 bipes no contexto já desbloqueado (ver `desbloquearAudio`).
function tocarBipe(ctx: AudioContext) {
  [0, 0.25, 0.5].forEach((t) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + t);
    o.stop(ctx.currentTime + t + 0.22);
  });
}

function avisar(titulo: string, corpo: string) {
  if ("Notification" in window && Notification.permission === "granted") new Notification(titulo, { body: corpo });
}

interface PomodoroContextValue {
  ajustes: Ajustes;
  modo: Modo;
  restante: number;
  rodando: boolean;
  ciclo: number;
  dia: { feitos: number; minutos: number };
  trocarModo: (proximo: Modo, novosAjustes?: Ajustes) => void;
  iniciarOuPausar: () => void;
  terminar: () => void;
  salvarAjustes: (form: HTMLFormElement) => void;
  desbloquearAudio: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro precisa estar dentro de <PomodoroProvider>");
  return ctx;
}

// Fica montado na raiz do layout (fora de `{children}`), então não desmonta
// ao trocar de página.
export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [ajustes, setAjustes] = useState<Ajustes>(PADRAO);
  const [modo, setModo] = useState<Modo>("focus");
  const [restante, setRestante] = useState(PADRAO.focus * 60);
  const [rodando, setRodando] = useState(false);
  const [ciclo, setCiclo] = useState(0); // pomodoros concluídos no ciclo atual
  const [dia, setDia] = useState({ feitos: 0, minutos: 0 });
  const fimEm = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);

  // Cria (uma vez) e destrava o áudio num clique de verdade — sem isso, o
  // navegador pode deixar o som "suspenso" (sem erro, sem som) quando o
  // temporizador termina sozinho, sem clique nenhum na hora.
  function desbloquearAudio() {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      if (audioCtx.current.state === "suspended") audioCtx.current.resume();
    } catch {
      // navegador sem áudio: segue sem som
    }
  }

  // Carrega ajustes e a contagem de hoje do aparelho (só no navegador).
  useEffect(() => {
    const t = setTimeout(() => {
      const salvos = { ...PADRAO, ...ler<Partial<Ajustes>>("pomo:settings", {}) };
      setAjustes(salvos);
      setRestante(salvos.focus * 60);
      const stats = ler<{ day?: string; done?: number; minutes?: number }>("pomo:stats", {});
      if (stats.day === new Date().toDateString()) setDia({ feitos: stats.done ?? 0, minutos: stats.minutes ?? 0 });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function trocarModo(proximo: Modo, novosAjustes = ajustes) {
    setRodando(false);
    setModo(proximo);
    setRestante(novosAjustes[proximo] * 60);
  }

  function iniciarOuPausar() {
    desbloquearAudio();
    if (rodando) {
      setRodando(false);
      return;
    }
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    fimEm.current = Date.now() + restante * 1000;
    setRodando(true);
  }

  function terminar() {
    setRodando(false);
    if (ajustes.sound && audioCtx.current) {
      // Resolve de novo bem na hora: cobre o caso da aba ter ficado em
      // segundo plano e o navegador ter suspendido o áudio nesse meio-tempo.
      const ctx = audioCtx.current;
      Promise.resolve(ctx.state === "suspended" ? ctx.resume() : undefined)
        .then(() => tocarBipe(ctx))
        .catch(() => {});
    }
    if (modo === "focus") {
      const hoje = { feitos: dia.feitos + 1, minutos: dia.minutos + ajustes.focus };
      setDia(hoje);
      guardar("pomo:stats", { day: new Date().toDateString(), done: hoje.feitos, minutes: hoje.minutos });
      const novoCiclo = ciclo + 1;
      setCiclo(novoCiclo);
      const proximo = novoCiclo >= ajustes.every ? "long" : "short";
      avisar("Pomodoro concluído! 🍊", proximo === "long" ? "Hora da pausa longa." : "Hora de uma pausa curta.");
      trocarModo(proximo);
    } else {
      if (modo === "long") setCiclo(0);
      avisar("Pausa encerrada", "Bora voltar ao foco.");
      trocarModo("focus");
    }
  }

  const aoTique = useEffectEvent(() => {
    const r = Math.max(0, Math.round((fimEm.current - Date.now()) / 1000));
    if (r === 0) terminar();
    else setRestante(r);
  });

  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(aoTique, 250);
    return () => clearInterval(id);
  }, [rodando]);

  // Tempo no título da aba enquanto roda.
  useEffect(() => {
    document.title = rodando ? `${formatar(restante)} · ${modo === "focus" ? "Foco" : "Pausa"}` : "Segundo Cérebro";
    return () => {
      document.title = "Segundo Cérebro";
    };
  }, [rodando, restante, modo]);

  function salvarAjustes(form: HTMLFormElement) {
    const dados = new FormData(form);
    const limitar = (nome: string, min: number, max: number, padrao: number) =>
      Math.min(max, Math.max(min, parseInt(String(dados.get(nome)), 10) || padrao));
    const novos: Ajustes = {
      focus: limitar("focus", 1, 120, PADRAO.focus),
      short: limitar("short", 1, 60, PADRAO.short),
      long: limitar("long", 1, 60, PADRAO.long),
      every: limitar("every", 2, 10, PADRAO.every),
      sound: dados.get("sound") === "on",
    };
    setAjustes(novos);
    guardar("pomo:settings", novos);
    setCiclo((c) => Math.min(c, novos.every));
    trocarModo(modo, novos);
  }

  return (
    <PomodoroContext.Provider
      value={{ ajustes, modo, restante, rodando, ciclo, dia, trocarModo, iniciarOuPausar, terminar, salvarAjustes, desbloquearAudio }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function Pomodoro() {
  const { ajustes, modo, restante, rodando, ciclo, dia, trocarModo, iniciarOuPausar, terminar, salvarAjustes, desbloquearAudio } =
    usePomodoro();
  const dialogo = useRef<HTMLDialogElement>(null);

  const total = ajustes[modo] * 60;
  const frase = MODOS.find((m) => m.id === modo)!.frase;

  // Espaço inicia/pausa (fora de campos de texto e dos ajustes).
  const aoTeclar = useEffectEvent((e: KeyboardEvent) => {
    const alvo = e.target as HTMLElement;
    if (e.code !== "Space" || dialogo.current?.open || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(alvo.tagName)) return;
    e.preventDefault();
    iniciarOuPausar();
  });
  useEffect(() => {
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const indiceModo = MODOS.findIndex((m) => m.id === modo);
  const textoBotao = rodando ? "Pausar" : restante < total ? "Continuar" : "Iniciar";

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-lg font-semibold text-primary" aria-live="polite">
        {frase}
      </p>

      {/* Controle segmentado com o "polegar" deslizando entre os modos. */}
      <div role="tablist" aria-label="Modo" className="relative mt-6 inline-grid grid-cols-3 rounded-full bg-black/[0.05] p-1">
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-1 top-1 rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] transition-transform duration-500 ease-suave"
          style={{ width: "calc((100% - 0.5rem) / 3)", transform: `translateX(${indiceModo * 100}%)` }}
        />
        {MODOS.map((m) => (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={modo === m.id}
            onClick={() => trocarModo(m.id)}
            className={`relative z-10 whitespace-nowrap rounded-full px-4 py-2 text-[0.9rem] sm:px-5 ${
              modo === m.id ? "font-semibold text-foreground" : "text-muted"
            }`}
          >
            {m.nome}
          </button>
        ))}
      </div>

      {/* Relógio com anel de progresso. */}
      <div className="relative mt-10 aspect-square w-[min(320px,80vw)]">
        <svg viewBox="0 0 320 320" aria-hidden="true" className="h-full w-full -rotate-90">
          <circle cx="160" cy="160" r="148" fill="none" strokeWidth="10" className="stroke-primary-soft" />
          <circle
            key={modo /* recria ao trocar de modo: o anel não "volta" animado */}
            cx="160"
            cy="160"
            r="148"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - restante / total)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-[clamp(3.5rem,16vw,5.25rem)] font-semibold tabular-nums tracking-[-0.04em]">
          <span role="timer" aria-live="off">
            {formatar(restante)}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-[26%] flex justify-center gap-2" aria-label={`${ciclo} de ${ajustes.every} sessões no ciclo`}>
          {Array.from({ length: ajustes.every }).map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full transition-colors duration-300 ${i < ciclo ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button type="button" onClick={() => trocarModo(modo)} className="rounded-full px-5 py-2.5 text-primary hover:bg-primary-soft">
          Reiniciar
        </button>
        <button type="button" onClick={iniciarOuPausar} className="botao min-w-36 px-6 py-3 text-base">
          {textoBotao}
        </button>
        <button
          type="button"
          onClick={() => {
            desbloquearAudio();
            terminar();
          }}
          className="rounded-full px-5 py-2.5 text-primary hover:bg-primary-soft"
        >
          Pular
        </button>
      </div>
      <p className="mt-6 text-sm text-muted">
        Aperte <kbd className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-xs">Espaço</kbd> para iniciar ou pausar.
      </p>

      <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-4">
        <div className="painel py-6">
          <span className="block text-4xl font-bold tabular-nums tracking-[-0.03em] text-primary">{dia.feitos}</span>
          <span className="text-sm text-muted">Pomodoros hoje</span>
        </div>
        <div className="painel py-6">
          <span className="block text-4xl font-bold tabular-nums tracking-[-0.03em] text-primary">{dia.minutos}</span>
          <span className="text-sm text-muted">Minutos focados</span>
        </div>
      </div>

      <button type="button" onClick={() => dialogo.current?.showModal()} className="mt-8 text-sm font-medium text-primary hover:text-primary-strong">
        Ajustes do pomodoro
      </button>

      <dialog
        ref={dialogo}
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-[22px] p-7 text-left text-foreground shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop:bg-black/25 backdrop:backdrop-blur-sm"
      >
        <form
          key={JSON.stringify(ajustes)}
          method="dialog"
          onSubmit={(e) => {
            if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "salvar") salvarAjustes(e.currentTarget);
          }}
        >
          <h2 className="text-2xl font-bold">Ajustes</h2>
          {(
            [
              ["focus", "Foco", 1, 120, "min"],
              ["short", "Pausa curta", 1, 60, "min"],
              ["long", "Pausa longa", 1, 60, "min"],
              ["every", "Pausa longa a cada", 2, 10, "sessões"],
            ] as const
          ).map(([nome, rotulo, min, max, unidade]) => (
            <label key={nome} className="flex items-center justify-between border-b border-border py-3.5">
              {rotulo}
              <span className="text-sm text-muted">
                <input
                  type="number"
                  name={nome}
                  min={min}
                  max={max}
                  defaultValue={ajustes[nome]}
                  className="campo mr-1.5 w-16 px-2 py-1 text-center text-foreground"
                />
                {unidade}
              </span>
            </label>
          ))}
          <label className="flex items-center justify-between py-3.5">
            Som ao terminar
            <input type="checkbox" name="sound" defaultChecked={ajustes.sound} className="h-5 w-5 accent-[#ff5a1f]" />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button value="cancelar" className="rounded-full px-4 py-2 text-primary hover:bg-primary-soft">
              Cancelar
            </button>
            <button value="salvar" className="botao">
              Salvar
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
