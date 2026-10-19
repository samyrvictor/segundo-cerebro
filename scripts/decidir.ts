// Regra de 3 vias do sincronizador: compara o hash atual do arquivo e da
// versão do banco com os hashes da última sincronização. "" = não existe.

export type Acao =
  | "nada" // ninguém mudou
  | "registrar" // os dois lados já estão iguais: só guarda o estado
  | "baixar" // banco → arquivo
  | "enviar" // arquivo → banco
  | "conflito" // os dois mudaram: banco vence, arquivo local vira cópia de conflito
  | "apagarLocal" // apagado no banco → apaga o arquivo
  | "apagarBanco" // apagado no Obsidian → apaga no banco
  | "esquecer"; // sumiu dos dois lados: tira do estado

export interface Entrada {
  estado?: { local: string; banco: string };
  local: string;
  banco: string;
  importar: boolean;
}

export function decidir({ estado, local, banco, importar }: Entrada): Acao {
  if (!local && !banco) return estado ? "esquecer" : "nada";

  if (!estado) {
    if (local && !banco) return "enviar";
    if (!local && banco) return "baixar";
    if (local === banco) return "registrar";
    // Primeira vez com os dois lados diferentes: na migração (--importar) o
    // vault vence; sem ela, o banco vence (estado perdido não pode apagar o app).
    return importar ? "enviar" : "baixar";
  }

  const localMudou = local !== estado.local;
  const bancoMudou = banco !== estado.banco;

  if (!localMudou && !bancoMudou) return "nada";
  if (localMudou && !bancoMudou) return local ? "enviar" : "apagarBanco";
  if (!localMudou && bancoMudou) return banco ? "baixar" : "apagarLocal";

  // Os dois mudaram.
  if (local === banco) return "registrar";
  if (!local) return "baixar"; // apagado no Obsidian mas editado no app: o app vence
  if (!banco) return "enviar"; // apagado no app mas editado no Obsidian: guarda a edição
  return "conflito";
}
