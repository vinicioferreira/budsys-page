import { Component, ViewChild } from '@angular/core';
import { ContatoService } from '../../services/contato.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CadenciaService } from '../../services/cadencia.service';
import { AgendaService } from '../../services/agenda.service';
import { ModalCadastroClientePotencialComponent } from '../../pages/admin/modal-cadastro-cliente-potencial/modal-cadastro-cliente-potencial.component';
import { MatDialog } from '@angular/material/dialog';
import { STATUS_COMERCIAL, getStatusColor, getStatusLabel } from '../../shared/status-comercial';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  displayedColumns: string[] = [
    'seqId',
    'status',
    'nome',
    'email',
    'telefone',
    'empresa',
    'mensagem',
    'dataCadastro',
    'canal',
    'actions'
  ];

  dataSource = new MatTableDataSource<any>([]);
  listaCanais: { nome: string; cadenciaId: string }[] = [];

  readonly statusList = STATUS_COMERCIAL;

  filtroTexto = '';
  filtroStatus = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private contatoService: ContatoService,
    private cadenciaService: CadenciaService,
    private agendaService: AgendaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cadenciaService.listarCadencias().subscribe(cadencias => {
      this.listaCanais = cadencias.map(c => ({ nome: c.nome, cadenciaId: c.id }));
    });

    this.contatoService.listarContatos().subscribe(data => {
      this.dataSource.data = data;

      if (this.sort) {
        this.dataSource.sort = this.sort;
        this.sort.active = 'dataCadastro';
        this.sort.direction = 'desc';
        this.sort.sortChange.emit({
          active: this.sort.active,
          direction: this.sort.direction
        });
      }
    });

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const { texto, status } = JSON.parse(filter || '{"texto":"","status":""}');
      const matchStatus = !status || data.status === status;
      const t = (texto || '').toLowerCase();
      const matchTexto = !t ||
        (data.nome || '').toLowerCase().includes(t) ||
        (data.empresa || '').toLowerCase().includes(t) ||
        (data.email || '').toLowerCase().includes(t) ||
        (data.telefone || '').toLowerCase().includes(t) ||
        (data.canal || '').toLowerCase().includes(t);
      return matchStatus && matchTexto;
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltros(): void {
    this.dataSource.filter = JSON.stringify({
      texto: this.filtroTexto,
      status: this.filtroStatus
    });
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getStatusLabel(value: string): string { return getStatusLabel(value); }
  getStatusColor(value: string): string { return getStatusColor(value); }

  vincularCanal(cliente: any) {
    if (!cliente.canal) {
      alert('⚠ Este cliente não tem canal definido!');
      return;
    }

    const canalSelecionado = this.listaCanais.find(
      c => c.nome.toLowerCase() === cliente.canal.toLowerCase()
    );

    if (canalSelecionado) {
      this.cadenciaService.getCadenciaById(canalSelecionado.cadenciaId).then(cadencia => {
        if (cadencia) {
          this.agendaService.gerarAtividadesDeCadencia(
            cadencia,
            cliente.id,
            cliente.nome,
            cliente.empresa || '',
            new Date()
          );
          alert(`✅ Cadência vinculada e atividades criadas na agenda para o canal "${cliente.canal}"`);
        } else {
          alert('⚠ Cadência não encontrada no banco!');
        }
      });
    } else {
      alert(`⚠ Nenhuma cadência vinculada ao canal: "${cliente.canal}"`);
    }
  }

  listarContatos(): void {
    this.contatoService.listarContatos().subscribe(data => {
      this.dataSource.data = data;

      if (this.sort) {
        this.dataSource.sort = this.sort;
        this.sort.active = 'dataCadastro';
        this.sort.direction = 'desc';
        this.sort.sortChange.emit({
          active: this.sort.active,
          direction: this.sort.direction
        });
      }
    });
  }

  abrirModalNovoCliente(): void {
    const dialogRef = this.dialog.open(ModalCadastroClientePotencialComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((contatoId: string | null) => {
      if (contatoId) {
        const cliente = this.dataSource.data.find(c => c.id === contatoId);

        if (!cliente) {
          return;
        }

        this.vincularCanal(cliente);
      }
    });
  }

  editarCliente(cliente: any): void {
    const dialogRef = this.dialog.open(ModalCadastroClientePotencialComponent, {
      width: '600px',
      data: cliente
    });

    dialogRef.afterClosed().subscribe((contatoId: string | null) => {
      if (!contatoId) return;
    });
  }

  async excluirCliente(cliente: any): Promise<void> {
    const confirmacao = confirm(`Deseja realmente excluir o cliente "${cliente.nome}"?`);

    if (!confirmacao) return;

    try {
      await this.contatoService.excluirContato(cliente.id);
      alert('Cliente excluído com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente.');
    }
  }

  async atualizarStatus(cliente: any) {
    try {
      await this.contatoService.atualizarContato(cliente.id, {
        status: cliente.status
      });

      await this.agendaService.atualizarStatusAtividadesPorContato(
        cliente.id,
        cliente.status
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  }
}