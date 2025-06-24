import { Component, OnInit } from '@angular/core';
import { Cadencia } from '../../interfaces/cadencia';
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

  abrirModalCadastro() {
    const dialogRef = this.dialog.open(ModalCadastroCadenciaComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.carregarCadencias(); // Recarrega lista se salvou
      }
    });
  }
}
