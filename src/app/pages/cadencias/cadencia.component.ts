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

  async editar(id: string) {
    // Aqui você pode abrir um modal de edição ou usar um formulário na tela
    const novoNome = prompt('Novo nome da cadência:');
    const novaDescricao = prompt('Nova descrição da cadência:');

    if (novoNome !== null && novaDescricao !== null) {
      await this.cadenciaService.editarCadencia(id, { nome: novoNome, descricao: novaDescricao });
      this.carregarCadencias();
    }
  }

  abrirModalNovaEtapa(cadenciaId: string) {
    // Pode abrir um modal ou usar prompt simples (exemplo simplificado):
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
    // Simples exemplo com prompt, pode ser modal também
    const canal = prompt('Novo canal:', etapa.canal);
    const mensagem = prompt('Nova mensagem:', etapa.mensagem);
    const dia = Number(prompt('Novo dia:', etapa.dia.toString()));

    if (canal && mensagem) {
      this.cadenciaService.editarEtapa(cadenciaId, index, { dia, canal, mensagem }).then(() => {
        alert('Etapa atualizada!');
        this.carregarCadencias();
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
