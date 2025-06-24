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
}
