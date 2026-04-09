import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
    'proximaAtividade',
    'contatarEm',
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
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cadenciaService.listarCadencias().subscribe(cadencias => {
      this.listaCanais = cadencias.map(c => ({ nome: c.nome, cadenciaId: c.id }));
    });

    this.carregarContatos();

    // Sempre que atividades mudam, atualiza a coluna Próx. atividade
    this.agendaService.escutarAtividades().subscribe(() => {
      this.atualizarProximasAtividades();
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

  async vincularCanal(cliente: any): Promise<void> {
    if (!cliente.canal) {
      alert('⚠ Este cliente não tem canal definido!');
      return;
    }

    const canalSelecionado = this.listaCanais.find(
      c => c.nome.toLowerCase() === cliente.canal.toLowerCase()
    );

    if (!canalSelecionado) {
      alert(`⚠ Nenhuma cadência vinculada ao canal: "${cliente.canal}"`);
      return;
    }

    const cadencia = await this.cadenciaService.getCadenciaById(canalSelecionado.cadenciaId);
    if (!cadencia) {
      alert('⚠ Cadência não encontrada no banco!');
      return;
    }

    await this.agendaService.gerarAtividadesDeCadencia(
      cadencia,
      cliente.id,
      cliente.nome,
      cliente.empresa || '',
      new Date()
    );

    alert(`✅ Cadência vinculada e atividades criadas na agenda para o canal "${cliente.canal}"`);
  }

  async atualizarProximasAtividades(): Promise<void> {
    const mapaAtividades = await this.agendaService.buscarProximasAtividadesPorContato();
    this.dataSource.data = this.dataSource.data.map(cliente => ({
      ...cliente,
      proximaAtividade: mapaAtividades.get(cliente.id) || null
    }));
  }

  carregarContatos(): void {
    this.contatoService.listarContatos().subscribe(async data => {
      const mapaAtividades = await this.agendaService.buscarProximasAtividadesPorContato();

      this.dataSource.data = data.map(cliente => ({
        ...cliente,
        status: cliente.status || 'novo',
        proximaAtividade: mapaAtividades.get(cliente.id) || null
      }));

      if (this.sort) {
        this.dataSource.sort = this.sort;
        this.sort.active = 'dataCadastro';
        this.sort.direction = 'desc';
        this.sort.sortChange.emit({ active: this.sort.active, direction: this.sort.direction });
      }
    });
  }

  formatarProximaAtividade(data: Date): string {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} ${hora}:${min}`;
  }

  badgeContatarEm(cliente: any): { label: string; classe: string } | null {
    const raw = cliente.contatarEm;
    if (!raw) return null;
    const data = raw?.toDate ? raw.toDate() : new Date(raw);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(data);
    alvo.setHours(0, 0, 0, 0);
    const diffDias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);

    if (diffDias < 0)  return { label: `Atrasado ${Math.abs(diffDias)}d`, classe: 'contatar-atrasado' };
    if (diffDias === 0) return { label: 'Hoje',                            classe: 'contatar-hoje' };
    if (diffDias === 1) return { label: 'Amanhã',                          classe: 'contatar-breve' };
    if (diffDias <= 7)  return { label: `Em ${diffDias} dias`,             classe: 'contatar-breve' };
    const dia = String(alvo.getDate()).padStart(2, '0');
    const mes = String(alvo.getMonth() + 1).padStart(2, '0');
    const ano = alvo.getFullYear();
    return { label: `${dia}/${mes}/${ano}`, classe: 'contatar-futuro' };
  }

  getCanalLabel(canal: string): string {
    const v = (canal || '').toLowerCase();
    switch (v) {
      case 'ligacao': case 'ligar': return 'Ligação';
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'E-mail';
      case 'reuniao': case 'reunião': case 'reuniao_agendada': return 'Reunião';
      default: return canal || '';
    }
  }

  abrirModalNovoCliente(): void {
    const dialogRef = this.dialog.open(ModalCadastroClientePotencialComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(async (contatoId: string | null) => {
      if (!contatoId) return;
      const cliente = await this.contatoService.buscarContatoPorId(contatoId);
      if (cliente) this.vincularCanal(cliente);
    });
  }

  editarCliente(cliente: any): void {
    const canalAnterior = cliente.canal || '';

    const dialogRef = this.dialog.open(ModalCadastroClientePotencialComponent, {
      width: '600px',
      data: cliente
    });

    dialogRef.afterClosed().subscribe(async (contatoId: string | null) => {
      if (!contatoId) return;

      const atualizado = await this.contatoService.buscarContatoPorId(contatoId);
      if (!atualizado) return;

      const canalNovo = atualizado.canal || '';
      if (canalNovo && canalNovo !== canalAnterior) {
        const confirmar = confirm(
          `O canal foi alterado de "${canalAnterior || '—'}" para "${canalNovo}".\n\n` +
          `Deseja substituir as atividades pendentes pela nova cadência?\n` +
          `(As atividades já concluídas serão mantidas.)`
        );
        if (confirmar) {
          await this.agendaService.excluirAtividadesPendentesPorContato(contatoId);
          await this.vincularCanal(atualizado);
        }
      }
    });
  }

  abrirPerfil(cliente: any): void {
    this.router.navigate(['/admin', cliente.id]);
  }

  irParaImportacao(): void {
    this.router.navigate(['/admin-importar']);
  }

  async excluirCliente(cliente: any): Promise<void> {
    const confirmacao = confirm(
      `Deseja realmente excluir "${cliente.nome}"?\n\nTodas as atividades vinculadas a este lead também serão excluídas.`
    );

    if (!confirmacao) return;

    try {
      await this.agendaService.excluirTodasAtividadesPorContato(cliente.id);
      await this.contatoService.excluirContato(cliente.id);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente.');
    }
  }

  async atualizarStatus(cliente: any) {
    try {
      await this.contatoService.atualizarStatusComFase(cliente.id, cliente.status);

      if (cliente.status === 'perdido') {
        await this.agendaService.excluirTodasAtividadesPorContato(cliente.id);
      } else {
        await this.agendaService.atualizarStatusAtividadesPorContato(
          cliente.id,
          cliente.status
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  }
}