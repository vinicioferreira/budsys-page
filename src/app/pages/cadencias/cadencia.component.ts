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
        width: '700px',
        data: { cadencia: cadenciaParaEditar }
      }).afterClosed().subscribe(resultado => {
        if (resultado) {
          this.carregarCadencias();
        }
      });
    }
  }

  abrirModalCadastro(cadencia?: Cadencia) {
    const dialogRef = this.dialog.open(ModalCadastroCadenciaComponent, {
      width: '700px',
      data: cadencia ? { cadencia } : {}
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.carregarCadencias();
      }
    });
  }

  editarEtapa(cadenciaId: string, etapa: Etapa, index: number) {
    const cadenciaParaEditar = this.cadenciasSalvas.find(c => c.id === cadenciaId);
    if (cadenciaParaEditar) {
      this.dialog.open(ModalCadastroCadenciaComponent, {
        width: '700px',
        data: { cadencia: cadenciaParaEditar, etapa, etapaIndex: index }
      }).afterClosed().subscribe(resultado => {
        if (resultado) {
          this.carregarCadencias();
        }
      });
    }
  }

  excluirEtapa(cadenciaId: string, index: number) {
    if (confirm('Excluir esta etapa?')) {
      this.cadenciaService.excluirEtapaPorIndex(cadenciaId, index).then(() => {
        alert('Etapa excluída!');
        this.carregarCadencias();
      });
    }
  }
}