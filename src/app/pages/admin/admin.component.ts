import { Component, ViewChild } from '@angular/core';
import { ContatoService } from '../../services/contato.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CadenciaService } from '../../services/cadencia.service';
import { AgendaService } from '../../services/agenda.service';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  displayedColumns: string[] = ['seqId', 'nome', 'email', 'telefone', 'empresa', 'mensagem', 'dataCadastro', 'canal'];
  dataSource = new MatTableDataSource<any>([]);
  listaCanais: { nome: string, cadenciaId: string }[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private contatoService: ContatoService,
    private cadenciaService: CadenciaService,
    private agendaService: AgendaService
  ) {}

  ngOnInit(): void {
    this.cadenciaService.listarCadencias().subscribe(cadencias => {
      this.listaCanais = cadencias.map(c => ({ nome: c.nome, cadenciaId: c.id }));
    });

    this.contatoService.listarContatos().subscribe(data => {
      this.dataSource.data = data;
      console.log('Clientes potenciais carregados:', data);

      // Aplica o sort
      this.dataSource.sort = this.sort;

      // Define a ordenação inicial (dataCadastro desc)
      this.sort.active = 'dataCadastro';
      this.sort.direction = 'desc';
      this.sort.sortChange.emit({
        active: this.sort.active,
        direction: this.sort.direction
      });
    });
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  vincularCanal(cliente: any) {
    const canalSelecionado = this.listaCanais.find(c => c.nome === cliente.canal);
    if (canalSelecionado) {
      this.cadenciaService.getCadenciaById(canalSelecionado.cadenciaId).then(cadencia => {
        if (cadencia) {
          this.agendaService.gerarAtividadesDeCadencia(cadencia, cliente.id, cliente.nome, new Date());
          alert('✅ Cadência vinculada e atividades criadas na agenda!');
        } else {
          alert('⚠ Cadência não encontrada no banco!');
        }
      });
    }
  }

}
