# Segundo Cérebro — frontend

App local (Next.js) que arquiva conteúdo como páginas `tipo: fonte` no wiki
pessoal (`../segundo-celebro/wiki/fontes/`, `../segundo-celebro/index.md`,
`../segundo-celebro/log.md` — ver `../CLAUDE.md`). `segundo-celebro/` é a
pasta que você abre como vault no Obsidian — fica separada de `frontend/`
de propósito, pra não misturar código/`node_modules` no grafo.

**Sem IA em lugar nenhum** — tudo é busca/leitura de conteúdo bruto, sem
resumo automático. Foi assim por escolha: a versão anterior tinha vídeo e
resumo de link/página via API paga da Anthropic; decidiu-se remover isso e
ficar só com o que funciona de graça.

## Como rodar

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Abra http://localhost:3000. Nenhuma variável de ambiente é obrigatória —
só preencha `.env.local` se for usar o Notion (ver seção abaixo).

## Seções

- **Texto** — cola um texto (salva como está) ou um link sozinho (busca o
  conteúdo — README puro se for GitHub, texto da página nos outros casos).
- **Buscar** — busca por palavra-chave em título/tags/conteúdo de tudo que
  já foi salvo.
- **Assuntos** — agrupa as fontes por um campo `assunto` escolhido ao salvar
  (Engenharia de Software, IA, Inglês, Empreendedorismo, Oratória).
- **Chrome** — botão que lê a barra de favoritos do Chrome local e busca o
  conteúdo de cada link, sem IA.
- **Notion** — botão "Conectar com Notion" (OAuth) + "Sincronizar", que traz
  o conteúdo puro da área "Ideias e Anotações".

## Requisitos no sistema

- **Favoritos do Chrome** — lê o perfil "Default" deste PC direto do
  arquivo local. Troque via `CHROME_PROFILE_DIR` em `.env.local`.
- **Notion** — precisa de uma integração OAuth própria (instruções em
  `.env.local.example`).

## Limitações conhecidas

- Roda só localmente — não há deploy/publicação configurada.
- Sem revisão antes de salvar: a página vai direto pro wiki. Edite ou
  apague pelo Obsidian se algo sair errado.
- Sem resumo/tags automáticos — o conteúdo é salvo como está, sem IA.
