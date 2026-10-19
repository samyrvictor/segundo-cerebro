# Segundo Cérebro

App pessoal de notas, rotina e produtividade — "segundo cérebro" no estilo
Obsidian, só que online. Guarda texto, links e transcrições de vídeo **sem
resumo de IA** (conteúdo bruto, buscável), e junto disso organiza rotina
diária, quadro de tarefas, estudos e um plano de inglês.

Feito pra uso próprio, com login por senha única (não é multiusuário).

## Stack

- **Next.js 16** (App Router) + TypeScript + React 19 + Tailwind v4
- **Supabase** (Postgres) como banco — todo acesso é feito pelo servidor,
  nunca direto do navegador
- **Vercel** para deploy

## Como rodar localmente

```bash
npm install
cp .env.local.example .env.local   # preencha os valores
npm run dev
```

Abra http://localhost:3000. Veja `.env.local.example` para o que cada
variável faz (Supabase, senha do app, OAuth do Notion, etc.).

## Funcionalidades

- **Início** — visão do dia: checklist do dia, o que está em andamento no
  quadro, tabela da semana.
- **Rotina** — calendário do ano inteiro; clica numa data e edita o checklist
  daquele dia direto (sem hábito fixo recorrente — cada dia é independente).
- **Quadro** — kanban de tarefas (A fazer / Fazendo / Feito), com área por
  cartão e arrastar-e-soltar.
- **Inglês** — roteiro de estudo (Fase 1, 12 semanas) com progresso salvo.
- **Estudos** — lista de tópicos que você está estudando, marcáveis.
- **Texto** — cola um texto, trecho de aula ou um link (GitHub, artigo,
  Google Docs, vídeo) e o app busca o conteúdo sozinho.
- **Buscar** (Ctrl+K) — busca full-text em tudo que já foi guardado.
- **Grafo** — as notas conectadas por `[[links]]`, como no grafo do Obsidian.
- **Sincronizar** — status da sincronização com Obsidian, Notion e Chrome.
- **Pomodoro** — temporizador de foco, com estatísticas do dia.

Vídeos (YouTube/TikTok/Instagram) entram numa fila e são processados depois,
no PC, via transcrição (ver `CLAUDE.md` na raiz do repositório para o fluxo
completo).

## Sincronização com o Obsidian

`npm run sincronizar` espelha o banco num vault local do Obsidian (pasta
`segundo-celebro/`, fora deste repositório) — mão dupla, por hash de 3 vias.
Notas editadas no Obsidian sobem pro banco; o banco é a fonte de verdade em
caso de conflito.

## Deploy

```bash
npx vercel deploy --prod
```

`.vercelignore` impede que segredos ou o vault local subam junto.

## Sem IA

Texto e link são salvos como estão — nenhum resumo automático. Escolha de
propósito: manter o app funcionando de graça, sem depender de API paga.
