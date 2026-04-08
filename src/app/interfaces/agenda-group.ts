import { CalendarEvent } from 'angular-calendar';

export type AgendaCondicao =
  | 'normal'
  | 'se_nao_atender'
  | 'se_nao_responder';

export interface AgendaAcao {
  canal: string;
  mensagem: string;
  condicao?: AgendaCondicao;
  horario?: string;
}

export interface AgendaEventMeta {
  id: string;
  contatoId: string | null;
  contatoNome: string;
  empresa: string;
  contatoTelefone: string;
  contatoEmail: string;
  anotacao: string;
  status: string;
  dataPrevista: string;
  acoes: AgendaAcao[];
}

export interface AgendaCalendarEvent extends CalendarEvent {
  color?: {
    primary: string;
    secondary: string;
  };
  meta: AgendaEventMeta;
}

export interface AgendaGroupedItem {
  event: AgendaCalendarEvent;
  color: string;
  labelCurta: string;
  labelCompleta: string;
}

export interface AgendaGroupedEmpresa {
  empresa: string;
  items: AgendaGroupedItem[];
}