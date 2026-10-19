"use client";

interface CheckProps {
  feito: boolean;
  label: string;
  onToggle: () => void;
  disabled?: boolean;
}

// Item de lista para marcar, no estilo do app Lembretes: um círculo que enche
// de laranja com o visto, e o texto esmaecendo suavemente.
export function Check({ feito, label, onToggle, disabled }: CheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={feito}
      onClick={onToggle}
      disabled={disabled}
      className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left active:scale-[0.99] disabled:opacity-60"
    >
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 ease-suave ${
          feito ? "border-primary bg-primary text-white" : "border-[#c7c7cc] bg-white group-hover:border-primary"
        }`}
      >
        <svg
          viewBox="0 0 12 12"
          width={11}
          height={11}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-all duration-300 ease-suave ${feito ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
        >
          <path d="m2.5 6.5 2.5 2.5 4.5-5" />
        </svg>
      </span>
      <span className={`text-[0.94rem] transition-colors duration-300 ${feito ? "text-muted line-through decoration-muted/60" : "text-foreground"}`}>
        {label}
      </span>
    </button>
  );
}
