export interface Cadencia {
  id: string;
  nome: string;
  descricao: string;
  etapas: Etapa[];
}

export interface Etapa {
  dia: number;
  acoes: AcaoEtapa[];
}

export interface AcaoEtapa {
  canal: string;
  mensagem: string;
  condicao?: 'normal' | 'se_nao_atender' | 'se_nao_responder';
}