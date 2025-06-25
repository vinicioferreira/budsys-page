import { Component, OnInit } from '@angular/core';
import { Cadencia, Etapa } from '../../interfaces/cadencia';
import { CadenciaService } from '../../services/cadencia.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalCadastroCadenciaComponent } from '../cadencias/modal-cadastro-cadencia/modal-cadastro-cadencia.component';

@Component({
  selector: 'app-cadencias',
  templateUrl: './cadencia.component.html',
  styleUrls: ['./cadencia.component.scss']
})
export class CadenciaComponent implements OnInit {
  cadenciasSalvas: Cadencia[] = [];

  constructor(
    private cadenciaService: CadenciaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregarCadencias();
  }

  carregarCadencias() {
    this.cadenciaService.listarCadencias().subscribe(cadencias => {
      this.cadenciasSalvas = cadencias;
    });
  }

  async excluir(id: string) {
    if (confirm('Tem certeza que deseja excluir esta cadência?')) {
      await this.cadenciaService.excluirCadencia(id);
      this.carregarCadencias();
    }
  }

  editar(id: string) {
    const cadenciaParaEditar = this.cadenciasSalvas.find(c => c.id === id);
    if (cadenciaParaEditar) {
      this.dialog.open(ModalCadastroCadenciaComponent, {
        width: '600px',
        data: { cadencia: cadenciaParaEditar }
      }).afterClosed().subscribe(resultado => {
        if (resultado) {
          this.carregarCadencias();  // Sempre recarrega
        }
      });
    }
  }

  abrirModalCadastro(cadencia?: Cadencia) {
    const dialogRef = this.dialog.open(ModalCadastroCadenciaComponent, {
      width: '600px',
      data: cadencia // Passa os dados da cadência se for edição
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.carregarCadencias(); // Recarrega lista se salvou/atualizou
      }
    });
  }

  abrirModalNovaEtapa(cadenciaId: string) {
    const dia = Number(prompt('Dia:'));
    const canal = prompt('Canal:');
    const mensagem = prompt('Mensagem:');

    if (canal && mensagem) {
      const novaEtapa: Etapa = { dia, canal, mensagem };
      this.cadenciaService.adicionarEtapa(cadenciaId, novaEtapa).then(() => {
        alert('Etapa adicionada!');
        this.carregarCadencias();
      });
    }
  }

  editarEtapa(cadenciaId: string, etapa: Etapa, index: number) {
    const cadenciaParaEditar = this.cadenciasSalvas.find(c => c.id === cadenciaId);
    if (cadenciaParaEditar) {
      this.dialog.open(ModalCadastroCadenciaComponent, {
        width: '600px',
        data: { cadencia: cadenciaParaEditar, etapa, etapaIndex: index }
      }).afterClosed().subscribe(resultado => {
        if (resultado) {
          this.carregarCadencias();
        }
      });
    }
  }

  excluirEtapa(cadenciaId: string, etapa: Etapa) {
    if (confirm('Excluir esta etapa?')) {
      this.cadenciaService.excluirEtapa(cadenciaId, etapa).then(() => {
        alert('Etapa excluída!');
        this.carregarCadencias();
      });
    }
  }
}
