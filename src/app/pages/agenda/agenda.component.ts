import { Component, OnInit } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

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

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.carregarAtividades();
  }

  async carregarAtividades(): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const snapshot = await getDocs(atividadesRef);

    this.events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        start: new Date(data['dataPrevista']),
        title: `${data['contatoNome']} - ${data['canal']}`,
        meta: data
      };
    });

    console.log('Atividades carregadas na agenda:', this.events);
  }

  handleEvent(event: CalendarEvent): void {
    const meta = event.meta;
    alert(
      `Cliente: ${meta.contatoNome}\n` +
      `Canal: ${meta.canal}\n` +
      `Mensagem: ${meta.mensagem}\n` +
      `Status: ${meta.status}`
    );
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

  onAddActivity(): void {
    if (this.newTitle && this.newDateStr && this.newTimeStr) {
      const [year, month, day] = this.newDateStr.split('-').map(Number);
      const [hour, minute] = this.newTimeStr.split(':').map(Number);
      const date = new Date(year, month - 1, day, hour, minute, 0);
      this.addActivity(date, this.newTitle);
      this.newTitle = '';
      this.newDateStr = '';
      this.newTimeStr = '';
    }
  }

  onDayClicked(day: any): void {
    const clickedDate = day.date;
    const year = clickedDate.getFullYear();
    const month = (clickedDate.getMonth() + 1).toString().padStart(2, '0');
    const date = clickedDate.getDate().toString().padStart(2, '0');
    this.newDateStr = `${year}-${month}-${date}`;
    this.viewDate = date;
    this.view = 'day';  // alterna automaticamente para a visão do dia clicado
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    this.viewDate = date;
    this.view = 'day';  // alterna automaticamente para a visão do dia clicado
  }

}
