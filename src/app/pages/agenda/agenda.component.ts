import { Component, OnInit } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { Firestore, collection, doc, getDoc, getDocs } from '@angular/fire/firestore';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { MatDialog } from '@angular/material/dialog';
import { ModalMessageComponent } from './modal-message/modal-message.component';
import { ChangeDetectorRef } from '@angular/core';
import { AgendaService } from '../../services/agenda.service';


@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit {
  viewDate: Date = new Date();
  view: string = 'month';
  events: CalendarEvent[] = [];
  newTitle: string = '';
  newDateStr: string = '';
  newTimeStr: string = '';

  constructor(
    private firestore: Firestore,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private agendaService: AgendaService
  ) { }

  ngOnInit(): void {
    this.carregarAtividades();
  }

  async carregarAtividades(): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const snapshot = await getDocs(atividadesRef);

    const statusCor: { [key: string]: { primary: string; secondary: string } } = {
      pendente: { primary: '#e53935', secondary: '#ffcdd2' },
      andamento: { primary: '#fb8c00', secondary: '#ffe0b2' },
      feito: { primary: '#43a047', secondary: '#c8e6c9' }
    };

    const eventos = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();

      const contatoTelefone = data['contatoId']
        ? await this.buscarTelefonePorContatoId(data['contatoId'])
        : '';

      const contatoEmail = data['contatoId']
        ? await this.buscarEmailContatoId(data['contatoId'])
        : '';

      const cor = statusCor[data['status']] || { primary: '#2196f3', secondary: '#bbdefb' };

      return {
        start: new Date(data['dataPrevista']),
        title: data['canal'] === 'manual'
          ? data['mensagem']
          : data['empresa']
            ? `${data['empresa']} • ${data['contatoNome']} • ${data['canal']}`
            : `${data['contatoNome']} • ${data['canal']}`,
        color: cor,
        meta: {
          id: doc.id,
          contatoId: data['contatoId'],
          contatoNome: data['contatoNome'],
          empresa: data['empresa'],
          contatoTelefone,
          contatoEmail,
          canal: data['canal'],
          mensagem: data['mensagem'],
          status: data['status'],
          dataPrevista: data['dataPrevista']
        }
      };
    }));

    this.events = [...eventos]; // cria nova referência para forçar update
  }

  handleEvent(event: CalendarEvent): void {
    const meta = event.meta;

    const dialogRef = this.dialog.open(ModalMessageComponent, {
      data: {
        id: meta.id,
        contatoId: meta.contatoId,
        contatoNome: meta.contatoNome,
        empresa: meta.empresa,
        contatoTelefone: meta.contatoTelefone,
        contatoEmail: meta.contatoEmail,
        canal: meta.canal,
        mensagem: meta.mensagem,
        status: meta.status,
        dataPrevista: meta.dataPrevista
      },
      width: '500px',
      height: '600px'
    });

    dialogRef.afterClosed().subscribe((reload: boolean) => {
      if (reload) {
        this.carregarAtividades(); // recarrega as atividades após atualização
      }
    });
  }

  addActivity(date: Date, title: string): void {
    this.events = [
      ...this.events,
      {
        start: date,
        title: title,
        allDay: false,
      }
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
      return contato['telefone'] || '';
    }

    return '';
  }

  async buscarEmailContatoId(contatoId: string): Promise<string> {
    const contatoRef = doc(this.firestore, 'contatos', contatoId);
    const contatoSnap = await getDoc(contatoRef);

    if (contatoSnap.exists()) {
      const contato = contatoSnap.data();
      return contato['email'] || '';
    }

    return '';
  }
}
