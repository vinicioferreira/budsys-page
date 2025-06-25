export interface Cadencia {
  id: string;
  nome: string;
  descricao: string;
  etapas: Etapa[];
}

export interface Etapa {
  dia: number;
  canal: string;
  mensagem: string;
}


