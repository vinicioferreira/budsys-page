import { Component, OnInit } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { ContatoService } from '../../services/contato.service';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit {
  viewDate: Date = new Date();          // Data atual no calendário
  view: string = 'month';               // Tipo de visualização: month, week, day
  events: CalendarEvent[] = [];         // Lista de eventos no calendário
  newTitle: string = '';
  newDateStr: string = '';

  constructor(private contatoService: ContatoService) {}

  ngOnInit(): void {
    this.contatoService.listarContatos().subscribe(data => {
      this.events = data
        .filter(c => c.dataCadastro)
        .map(c => ({
          start: new Date(c.dataCadastro),
          title: `${c.nome} - ${c.empresa}`,
          meta: c
        }));
    });
  }

  handleEvent(event: CalendarEvent): void {
    console.log('Evento clicado:', event.meta);
    alert(`Cliente: ${event.meta.nome}\nEmpresa: ${event.meta.empresa}\nEmail: ${event.meta.email}`);
  }

  addActivity(date: Date, title: string): void {
    this.events = [
      ...this.events,
      {
        start: date,
        title: title,
        allDay: true
      }
    ];
  }

  onAddActivity(): void {
    if (this.newTitle && this.newDateStr) {
      const [year, month, day] = this.newDateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0); // meio-dia local
      this.addActivity(date, this.newTitle);
      this.newTitle = '';
      this.newDateStr = '';
    }
  }

  onDayClicked(day: any): void {
    const clickedDate = day.date;
    const year = clickedDate.getFullYear();
    const month = (clickedDate.getMonth() + 1).toString().padStart(2, '0');
    const date = clickedDate.getDate().toString().padStart(2, '0');
    this.newDateStr = `${year}-${month}-${date}`;
  }
}
