// Um item do checklist de um dia específico. Arquivo sem acesso ao banco,
// para poder ser usado também nos componentes do navegador.
export interface ItemDia {
  id: number;
  texto: string;
  feito: boolean;
}
