import { CalendarEvent } from "angular-calendar";


export interface AgendaEventMeta {
    id: string;
    contatoId: string | null;
    contatoNome: string;
    empresa: string;
    contatoTelefone: string;
    contatoEmail: string;
    canal: string;
    mensagem: string;
    anotacao: string;
    status: string;
    dataPrevista: string;
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
    canal: string;
    labelCurta: string;
    labelCompleta: string;
}

export interface AgendaGroupedEmpresa {
    empresa: string;
    items: AgendaGroupedItem[];
}