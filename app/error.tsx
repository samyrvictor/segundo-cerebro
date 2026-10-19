"use client";

// Tela de erro do app inteiro (no lugar da tela preta genérica). Em produção a
// mensagem real do erro fica escondida; o código abaixo aparece nos logs da Vercel.
export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-8 pb-24 pt-20">
      <h1 className="text-2xl font-bold tracking-[-0.03em]">Não consegui carregar esta página</h1>
      <p className="mt-3 text-sm text-muted">
        Geralmente é o banco de dados fora do ar. O plano grátis do Supabase pausa o projeto depois de 7 dias sem
        uso — se for isso, abra o painel do Supabase e clique em &ldquo;Restore project&rdquo;.
      </p>
      {error.digest && <p className="mt-3 font-mono text-xs text-muted">código: {error.digest}</p>}
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 self-start botao"
      >
        Tentar de novo
      </button>
    </div>
  );
}
