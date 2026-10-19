import { SEMANAS_01_04 } from "./semanas-01-04";
import { SEMANAS_05_08 } from "./semanas-05-08";
import { SEMANAS_09_12 } from "./semanas-09-12";
import type { DiaIngles, SemanaIngles } from "./tipos";

export type { DiaIngles, SemanaIngles } from "./tipos";

export const SEMANAS: SemanaIngles[] = [...SEMANAS_01_04, ...SEMANAS_05_08, ...SEMANAS_09_12];
export const TOTAL_DIAS = SEMANAS.length * 7;

// Premissas que o usuário não preencheu no prompt — explícitas para poder corrigir.
export const PERFIL = {
  nivelAtual: "Iniciante (entende poucas coisas)",
  meta: "C1",
  tempoAtivo: "30 min por dia",
  dificuldades: "Falar, entender e ler",
  objetivo: "Carreira em tech / IA (premissa — ajuste se for outro)",
  habilidadePrincipal: "Falar (premissa)",
  interesses: "Programação, IA, empreendedorismo, vendas, oratória, treino / futevôlei (premissa)",
};

export const ESTRATEGIA: { titulo: string; itens: string[] }[] = [
  {
    titulo: "Diagnóstico",
    itens: [
      "Hoje o gargalo é compreensão — sem entender, a fala não tem de onde sair. Por isso a Fase 1 é ~70% input compreensível e vocabulário de alta frequência.",
      "A fala entra todo dia em doses pequenas e sem pressão de acertar: shadowing, roleplay com IA e micro-hábitos.",
      "30 min ativos é pouco para chegar ao C1 sozinho — o que vai fazer a diferença é a imersão nos tempos mortos (abaixo). Trate os 30 min como musculação e a imersão como alimentação.",
    ],
  },
  {
    titulo: "Método natural + input compreensível",
    itens: [
      "Você adquire o idioma entendendo mensagens um pouco acima do seu nível — não decorando regras.",
      "Regra de ouro: consuma conteúdo que você entende de 60% a 90%. Se entende menos, troque por algo mais fácil (desenho, conteúdo para aprendizes).",
      "Gramática entra depois, só para organizar o que você já ouviu — por isso ela aparece no 3º dia da semana, não no 1º.",
    ],
  },
  {
    titulo: "Imersão em tempos mortos",
    itens: [
      "Celular, computador e VS Code em inglês (semana 5 é a data-limite).",
      "Treine o algoritmo: por 2 semanas, siga, curta e assista só criadores em inglês dos seus interesses (tech, IA, empreendedorismo, futevôlei). O feed vira input.",
      "Podcast ou vídeo do barril no trânsito, no treino e lavando louça.",
      "Netflix / YouTube com Language Reactor (legenda dupla) quando for assistir por lazer.",
    ],
  },
  {
    titulo: "Barril de conteúdos",
    itens: [
      "No último dia de cada semana do plano, monte uma playlist com 5–10 vídeos / podcasts do tema da semana seguinte.",
      "Separe em pastas por tipo: vídeo curto (até 10 min), podcast / áudio, leitura.",
      "Durante a semana você não escolhe nada — só aperta play no barril. Escolher na hora é onde o tempo vaza.",
    ],
  },
  {
    titulo: "Micro-hábitos",
    itens: [
      "Pensar em inglês: narre o que está fazendo, mesmo que seja só o verbo.",
      "Falar sozinho no banho, no carro e no treino.",
      "Nomear objetos e ações ao redor — quando não souber, pesquise na hora (IA ou YouGlish) e anote para o Anki.",
    ],
  },
  {
    titulo: "Imersão ativa",
    itens: [
      "Shadowing e chorusing: repetir junto e logo atrás do áudio, imitando ritmo e entonação.",
      "Sentence mining + flashcards: frases inteiras de conteúdo real no Anki, não palavras soltas.",
      "Escrita ativa com correção de IA: escrever, pedir correção explicada em português, reler em voz alta.",
      "Interação com conteúdo: pausar vídeos que você já viu para responder os personagens, opinar e fazer perguntas — cada lacuna ('como eu diria isso?') vira pesquisa.",
      "Roleplay por voz com IA em situações reais do seu dia (entrevista, restaurante, pitch).",
    ],
  },
  {
    titulo: "Recursos (gratuitos ou quase)",
    itens: [
      "Vídeo para aprendizes: VOA Learning English (Let's Learn English), Easy English, Extra English, BBC Learning English.",
      "Áudio: Easy Stories in English, BBC 6 Minute English.",
      "Pronúncia: Rachel's English, YouGlish (ouvir qualquer palavra em vídeos reais).",
      "Ferramentas: Anki, Language Reactor, Claude / ChatGPT (correção e roleplay por voz).",
      "Leitura: graded readers (Penguin Readers, Oxford Bookworms) começando no nível Starter.",
      "A partir da Fase 2: conversa com nativos no HelloTalk ou Tandem.",
    ],
  },
  {
    titulo: "Estimativa realista",
    itens: [
      "Com 30 min ativos por dia + ~1h de imersão nos tempos mortos:",
      "A2 em ~3–4 meses · B1 em ~9–12 meses · B2 em ~18–24 meses · C1 em ~2,5–3,5 anos.",
      "O que mais pesa para chegar ao C1 é o volume de horas ouvindo e lendo. Dobrar a imersão passiva encurta esse prazo mais do que dobrar o estudo ativo.",
    ],
  },
];

export const FASES = [
  { nome: "Fase 1 — Base", periodo: "Semanas 1–12 (~3 meses)", nivel: "A0 → A2", detalhada: true,
    resumo: "Sons do inglês, vocabulário de alta frequência, frases do dia a dia. Detalhada abaixo." },
  { nome: "Fase 2 — Conversa do dia a dia", periodo: "Semanas 13–26", nivel: "A2 → B1", detalhada: false,
    resumo: "Séries com legenda em inglês, podcasts para aprendizes, primeiras conversas com nativos." },
  { nome: "Fase 3 — Inglês de trabalho e tech", periodo: "Semanas 27–52", nivel: "B1 → B1+", detalhada: false,
    resumo: "Conteúdo nativo de tech e IA, reuniões, explicar código, escrever e-mails." },
  { nome: "Fase 4 — Fluência", periodo: "Ano 2", nivel: "B2", detalhada: false,
    resumo: "Séries sem legenda, podcasts nativos, apresentações e discussões." },
  { nome: "Fase 5 — Precisão", periodo: "Ano 3", nivel: "C1", detalhada: false,
    resumo: "Nuance, expressões idiomáticas, falar em público, escrever como nativo." },
];

export function idDoDia(semana: number, dia: number): string {
  return `S${String(semana).padStart(2, "0")}D${dia}`;
}

// Ritmo fixo dos 7 dias de cada semana (30 min ativos), preenchido com o tema.
// Os dias não têm data: o plano segue no seu ritmo, faltar um dia não quebra nada.
// As 70 palavras entram em 4 dias: 20 + 20 + 15 + 15.
export function diasDaSemana(s: SemanaIngles): DiaIngles[] {
  const principal = s.recursos[0];
  const secundario = s.recursos[1] ?? s.recursos[0];
  const ritmo: { foco: string; curto: string; blocos: DiaIngles["blocos"] }[] = [
    {
      foco: "Input + palavras novas",
      curto: "Input",
      blocos: [
        { atividade: `Input compreensível do tema "${s.tema}": ${s.input}`, recurso: principal, minutos: 15 },
        { atividade: "Coloque no Anki as palavras 1–20 da semana, cada uma com uma frase de exemplo (não só a tradução).", recurso: "Anki", minutos: 15 },
      ],
    },
    {
      foco: "Shadowing",
      curto: "Shadowing",
      blocos: [
        { atividade: `Shadowing: ${s.shadowing}. Ouça uma vez, depois repita junto (chorusing) e por fim logo atrás do áudio (shadowing).`, recurso: "Áudio do tema + YouGlish para palavras difíceis", minutos: 20 },
        { atividade: "Anki: revisar + palavras 21–40.", recurso: "Anki", minutos: 10 },
      ],
    },
    {
      foco: "Gramática em contexto + sentence mining",
      curto: "Gramática",
      blocos: [
        { atividade: `Gramática: ${s.gramatica.titulo}. Leia a explicação, repita os exemplos em voz alta e crie 3 frases suas.`, recurso: "Esta página", minutos: 10 },
        { atividade: "Sentence mining: volte no conteúdo do Dia 1 e copie 5–8 frases reais para o Anki (a frase inteira na frente do cartão).", recurso: principal, minutos: 15 },
        { atividade: "Anki: palavras 41–55.", recurso: "Anki", minutos: 5 },
      ],
    },
    {
      foco: "Escrita ativa com IA",
      curto: "Escrita",
      blocos: [
        { atividade: `Escrita: ${s.escrita}`, recurso: "Caderno ou bloco de notas", minutos: 10 },
        { atividade: "Cole no Claude ou ChatGPT: 'Corrija meus erros, explique em português e reescreva de forma natural.' Releia a versão corrigida em voz alta.", recurso: "Claude ou ChatGPT", minutos: 10 },
        { atividade: "Anki: palavras 56–70 + as frases corrigidas.", recurso: "Anki", minutos: 10 },
      ],
    },
    {
      foco: "Roleplay (falar)",
      curto: "Falar",
      blocos: [
        { atividade: `Roleplay por voz: ${s.roleplay} Peça para a IA falar simples e só corrigir no final.`, recurso: "Modo de voz do Claude ou ChatGPT", minutos: 20 },
        { atividade: "Anote 3 coisas que você não soube dizer e pesquise como se fala.", recurso: "YouGlish / IA", minutos: 10 },
      ],
    },
    {
      foco: "Interação com conteúdo",
      curto: "Conteúdo",
      blocos: [
        { atividade: "Reveja um vídeo da semana pausando: responda os personagens em voz alta, dê sua opinião, faça perguntas. Anote as lacunas ('como eu diria isso?').", recurso: secundario, minutos: 20 },
        { atividade: "Pesquise as lacunas e coloque no Anki.", recurso: "YouGlish / Anki", minutos: 10 },
      ],
    },
    {
      foco: "Revisão + barril da próxima semana",
      curto: "Revisão",
      blocos: [
        { atividade: "Revisão leve: reouça o melhor conteúdo da semana sem pausar e revise o deck inteiro da semana.", recurso: "Anki + seu conteúdo favorito", minutos: 20 },
        { atividade: "Monte o barril da semana que vem: separe 5–10 vídeos / podcasts do próximo tema numa playlist.", recurso: "Playlist do YouTube / pasta", minutos: 10 },
      ],
    },
  ];

  return ritmo.map((r, i) => ({
    id: idDoDia(s.numero, i + 1),
    numero: i + 1,
    curto: r.curto,
    foco: r.foco,
    blocos: r.blocos,
  }));
}

// Markdown que vive no vault (escrito pelo sincronizador), com os dias já feitos marcados.
// Cada dia carrega um marcador invisível `<!-- id:S01D1 -->` para o sync achar a linha.
export function gerarMarkdown(feitos: Set<string>): string {
  const linhas: string[] = [
    "---",
    "tipo: plano",
    "---",
    "# Plano de Inglês — Fase 1 (A0 → A2)",
    "",
    "Gerado pelo app Segundo Cérebro. Marque os dias aqui ou no app — os dois leem este arquivo.",
    "",
  ];

  for (const s of SEMANAS) {
    linhas.push(`## Semana ${s.numero} — ${s.tema}`, "");
    linhas.push(`**Gramática:** ${s.gramatica.titulo}`, "");
    linhas.push(`**Recursos:** ${s.recursos.join(" · ")}`, "");
    for (const d of diasDaSemana(s)) {
      const marca = feitos.has(d.id) ? "x" : " ";
      linhas.push(`- [${marca}] Dia ${d.numero} — ${d.foco} <!-- id:${d.id} -->`);
    }
    linhas.push("", `> [!note]- Vocabulário (${s.vocab.length})`);
    linhas.push(`> ${s.vocab.map(([en, pt]) => `${en} — ${pt}`).join(" · ")}`, "");
  }

  return linhas.join("\n");
}
