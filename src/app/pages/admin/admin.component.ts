import { Component, ViewChild } from '@angular/core';
import { ContatoService } from '../../services/contato.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CadenciaService } from '../../services/cadencia.service';
import { AgendaService } from '../../services/agenda.service';
import { ModalCadastroClientePotencialComponent } from '../../pages/admin/modal-cadastro-cliente-potencial/modal-cadastro-cliente-potencial.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  displayedColumns: string[] = ['seqId', 'nome', 'email', 'telefone', 'empresa', 'mensagem', 'dataCadastro', 'canal', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  listaCanais: { nome: string, cadenciaId: string }[] = [];

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
      console.log('Lista atualizada automaticamente:', data);

      this.dataSource.sort = this.sort;
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
    console.log('🔍 Vinculando canal para cliente:', cliente);

    if (!cliente.canal) {
      alert('⚠ Este cliente não tem canal definido!');
      return;
    }

    const canalSelecionado = this.listaCanais.find(c => c.nome.toLowerCase() === cliente.canal.toLowerCase());
    console.log('🔍 Canal selecionado na lista de cadências:', canalSelecionado);

    if (canalSelecionado) {
      this.cadenciaService.getCadenciaById(canalSelecionado.cadenciaId).then(cadencia => {
        if (cadencia) {
          this.agendaService.gerarAtividadesDeCadencia(cadencia, cliente.id, cliente.nome, new Date());
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
      console.log('Clientes potenciais carregados:', data);

      // Aplica sort
      this.dataSource.sort = this.sort;

      // Ordenação inicial
      this.sort.active = 'dataCadastro';
      this.sort.direction = 'desc';
      this.sort.sortChange.emit({
        active: this.sort.active,
        direction: this.sort.direction
      });
    });
  }

  abrirModalNovoCliente(): void {
    const dialogRef = this.dialog.open(ModalCadastroClientePotencialComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((contatoId: string | null) => {
      if (contatoId) {
        console.log('Contato salvo com ID:', contatoId);

        const cliente = this.dataSource.data.find(c => c.id === contatoId);

        if (!cliente) {
          console.warn('⚠ Cliente não encontrado na lista');
          return;
        }

        this.vincularCanal(cliente);  // 🚀 Chama o método que já funciona
      }
    });
  }
}
