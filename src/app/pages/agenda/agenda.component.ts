import { Component, OnInit } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
} from '@angular/fire/firestore';
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';
import { MatDialog } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';

import { ModalMessageComponent } from './modal-message/modal-message.component';
import { AgendaService } from '../../services/agenda.service';
import {
  AgendaCalendarEvent,
  AgendaGroupedEmpresa,
  AgendaEventMeta,
  AgendaAcao,
  AgendaAnotacao,
  AgendaCondicao,
} from '../../interfaces/agenda-group';
import { STATUS_COMERCIAL, getStatusCor } from '../../shared/status-comercial';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
})
export class AgendaComponent implements OnInit {
  viewDate: Date = new Date();
  view: string = 'month';
  events: AgendaCalendarEvent[] = [];
  newTitle: string = '';
  newDateStr: string = '';
  newTimeStr: string = '';
  locale: string = 'pt-BR';
  expandedDayKey: string | null = null;

  readonly statusList = STATUS_COMERCIAL;

  constructor(
    private firestore: Firestore,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private agendaService: AgendaService,
  ) { }

  ngOnInit(): void {
    this.carregarAtividades();
  }

  async carregarAtividades(): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const snapshot = await getDocs(atividadesRef);

    const eventos: AgendaCalendarEvent[] = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        const contatoId = data['contatoId'] ?? null;
        const contatoTelefone = contatoId
          ? await this.buscarTelefonePorContatoId(contatoId)
          : '';

        const contatoEmail = contatoId
          ? await this.buscarEmailContatoId(contatoId)
          : '';

        const cor = getStatusCor(data['status']);

        const empresa = String(data['empresa'] || '').trim();
        const contatoNome = String(data['contatoNome'] || '').trim();

        const acoes: AgendaAcao[] = Array.isArray(data['acoes'])
          ? data['acoes'].map((acao: any): AgendaAcao => ({
            canal: String(acao?.canal || '').trim(),
            mensagem: String(acao?.mensagem || '').trim(),
            condicao: (
              ['normal', 'se_nao_atender', 'se_nao_responder'].includes(acao?.condicao)
                ? acao.condicao
                : 'normal'
            ) as AgendaCondicao,
            horario: String(acao?.horario || '').trim(),
            feito: Boolean(acao?.feito ?? false)
          }))
          : [
            {
              canal: String(data['canal'] || '').trim(),
              mensagem: String(data['mensagem'] || '').trim(),
              condicao: 'normal',
              horario: ''
            }
          ];

        const anotacaoLog: AgendaAnotacao[] = Array.isArray(data['anotacaoLog'])
          ? data['anotacaoLog'].map((n: any) => ({
            texto: String(n?.texto || ''),
            criadoEm: String(n?.criadoEm || '')
          }))
          : [];

        const meta: AgendaEventMeta = {
          id: docSnap.id,
          contatoId,
          contatoNome,
          empresa,
          contatoTelefone,
          contatoEmail,
          anotacao: String(data['anotacao'] || ''),
          anotacaoLog,
          status: String(data['status'] || ''),
          dataPrevista: String(data['dataPrevista'] || ''),
          acoes
        };

        return {
          start: new Date(data['dataPrevista']),
          title: this.montarTituloEvento(empresa, contatoNome, acoes),
          color: cor,
          meta,
        };
      }),
    );

    this.events = [...eventos];
    this.cdr.detectChanges();
  }

  montarTituloEvento(empresa: string, contatoNome: string, acoes: AgendaAcao[]): string {
    const primeiraAcao = acoes?.[0];
    const canalLabel = primeiraAcao?.canal
      ? this.getCanalLabel(primeiraAcao.canal)
      : 'Atividade';

    const qtd = acoes?.length || 0;
    const sufixo = qtd > 1 ? ` +${qtd - 1}` : '';

    if (empresa && contatoNome) {
      return `${empresa} • ${contatoNome} • ${canalLabel}${sufixo}`;
    }

    if (empresa) {
      return `${empresa} • ${canalLabel}${sufixo}`;
    }

    if (contatoNome) {
      return `${contatoNome} • ${canalLabel}${sufixo}`;
    }

    return `${canalLabel}${sufixo}`;
  }

  getCanalLabel(canal: string): string {
    const value = (canal || '').toLowerCase();

    switch (value) {
      case 'ligacao':
      case 'ligar':
        return 'Ligação';
      case 'whatsapp':
        return 'WhatsApp';
      case 'email':
        return 'E-mail';
      case 'reuniao':
      case 'reunião':
      case 'reuniao_agendada':
        return 'Reunião';
      case 'manual':
        return 'Manual';
      default:
        return canal || 'Atividade';
    }
  }

  getCanalCurto(canal: string): string {
    const value = (canal || '').toLowerCase();

    switch (value) {
      case 'ligacao':
      case 'ligar':
        return 'Lig';
      case 'whatsapp':
        return 'Whats';
      case 'email':
        return 'E-mail';
      case 'reuniao':
      case 'reunião':
      case 'reuniao_agendada':
        return 'Reun';
      case 'manual':
        return 'Manual';
      default:
        return canal || 'Ativ';
    }
  }

  getEmpresaOuContato(event: AgendaCalendarEvent): string {
    const empresa = event.meta?.empresa?.trim();
    const contatoNome = event.meta?.contatoNome?.trim();

    if (empresa) return empresa;
    if (contatoNome) return contatoNome;

    return 'Sem empresa';
  }

  getGroupedEvents(events: CalendarEvent[]): AgendaGroupedEmpresa[] {
    if (!events?.length) return [];

    const mapa = new Map<string, AgendaGroupedEmpresa>();

    const eventosOrdenados = [...events].sort((a, b) => {
      const da = a.start ? new Date(a.start).getTime() : 0;
      const db = b.start ? new Date(b.start).getTime() : 0;
      return da - db;
    });

    for (const eventBase of eventosOrdenados) {
      const event = eventBase as AgendaCalendarEvent;

      const empresa = this.getEmpresaOuContato(event);
      const primeiraAcao = event.meta?.acoes?.[0];
      const canal = primeiraAcao?.canal || '';
      const qtdAcoes = event.meta?.acoes?.length || 0;
      const statusColor = event.color?.primary || '#2196f3';

      const hora = event.start
        ? new Date(event.start).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
        : '';

      if (!mapa.has(empresa)) {
        mapa.set(empresa, {
          empresa,
          items: [],
        });
      }

      mapa.get(empresa)!.items.push({
        event,
        color: statusColor,
        labelCurta: `${this.getCanalCurto(canal)}${qtdAcoes > 1 ? ' +' + (qtdAcoes - 1) : ''} ${hora}`.trim(),
        labelCompleta: `${this.getCanalLabel(canal)}${qtdAcoes > 1 ? ' +' + (qtdAcoes - 1) + ' ações' : ''}${hora ? ' • ' + hora : ''}${event.meta?.contatoNome ? ' • ' + event.meta.contatoNome : ''}`.trim(),
      });
    }

    return Array.from(mapa.values()).sort(
      (a, b) => b.items.length - a.items.length,
    );
  }

  onEventChipClick(mouseEvent: MouseEvent, event: AgendaCalendarEvent): void {
    mouseEvent.stopPropagation();
    this.handleEvent(event);
  }

  handleEvent(event: CalendarEvent): void {
    const meta = event.meta as AgendaEventMeta;

    const dialogRef = this.dialog.open(ModalMessageComponent, {
      data: {
        id: meta.id,
        contatoId: meta.contatoId,
        contatoNome: meta.contatoNome,
        empresa: meta.empresa,
        contatoTelefone: meta.contatoTelefone,
        contatoEmail: meta.contatoEmail,
        anotacao: meta.anotacao || '',
        anotacaoLog: meta.anotacaoLog || [],
        status: meta.status,
        dataPrevista: meta.dataPrevista,
        acoes: meta.acoes || [],
        canal: meta.acoes?.[0]?.canal || '',
        mensagem: meta.acoes?.[0]?.mensagem || '',
      },
      width: '500px',
      height: '850px',
    });

    dialogRef.afterClosed().subscribe((reload: boolean) => {
      if (reload) {
        this.carregarAtividades();
      }
    });
  }
  
  addActivity(date: Date, title: string): void {
    this.events = [
      ...this.events,
      {
        start: date,
        title,
        allDay: false,
        color: {
          primary: '#1e88e5',
          secondary: '#bbdefb',
        },
        meta: {
          id: '',
          contatoId: null,
          contatoNome: title,
          empresa: '',
          contatoTelefone: '',
          contatoEmail: '',
          anotacao: '',
          anotacaoLog: [],
          status: 'novo',
          dataPrevista: date.toISOString(),
          acoes: [
            {
              canal: 'manual',
              mensagem: title,
              condicao: 'normal',
              horario: ''
            }
          ]
        },
      },
    ];
  }

  async onAddActivity(): Promise<void> {
    if (!this.newTitle || !this.newDateStr || !this.newTimeStr) {
      alert('Preencha título, data e hora.');
      return;
    }

    const [year, month, day] = this.newDateStr.split('-').map(Number);
    const [hour, minute] = this.newTimeStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute, 0);

    try {
      await this.agendaService.criarAtividadeManual(this.newTitle, date);
      await this.carregarAtividades();

      this.viewDate = new Date(date);
      this.view = 'day';

      this.newTitle = '';
      this.newDateStr = '';
      this.newTimeStr = '';

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro ao adicionar atividade manual:', error);
      alert('Erro ao adicionar atividade.');
    }
  }

  onDayClicked(day: any): void {
    const clickedDate = day.date;
    this.newDateStr = clickedDate.toISOString().substring(0, 10);
    this.viewDate = clickedDate;
    this.view = 'day';
  }

  next(): void {
    if (this.view === 'month') {
      this.viewDate = addMonths(this.viewDate, 1);
    } else if (this.view === 'week') {
      this.viewDate = addWeeks(this.viewDate, 1);
    } else if (this.view === 'day') {
      this.viewDate = addDays(this.viewDate, 1);
    }
  }

  previous(): void {
    if (this.view === 'month') {
      this.viewDate = subMonths(this.viewDate, 1);
    } else if (this.view === 'week') {
      this.viewDate = subWeeks(this.viewDate, 1);
    } else if (this.view === 'day') {
      this.viewDate = subDays(this.viewDate, 1);
    }
  }

  async buscarTelefonePorContatoId(contatoId: string): Promise<string> {
    const contatoRef = doc(this.firestore, 'contatos', contatoId);
    const contatoSnap = await getDoc(contatoRef);

    if (contatoSnap.exists()) {
      const contato = contatoSnap.data();
      return String(contato['telefone'] || '');
    }

    return '';
  }

  async buscarEmailContatoId(contatoId: string): Promise<string> {
    const contatoRef = doc(this.firestore, 'contatos', contatoId);
    const contatoSnap = await getDoc(contatoRef);

    if (contatoSnap.exists()) {
      const contato = contatoSnap.data();
      return String(contato['email'] || '');
    }

    return '';
  }

  getDayKey(day: any): string {
    const d = day?.date ? new Date(day.date) : new Date(day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }

  isDayExpanded(day: any): boolean {
    return this.expandedDayKey === this.getDayKey(day);
  }

  toggleDayExpansion(day: any, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const key = this.getDayKey(day);
    this.expandedDayKey = this.expandedDayKey === key ? null : key;
  }
}


