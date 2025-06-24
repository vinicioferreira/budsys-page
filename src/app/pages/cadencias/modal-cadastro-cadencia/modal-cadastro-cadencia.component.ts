import { Component } from '@angular/core';
import { Cadencia, Etapa } from '../../../interfaces/cadencia';
import { CadenciaService } from '../../../services/cadencia.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-cadastro-cadencia',
  templateUrl: './modal-cadastro-cadencia.component.html',
  styleUrls: ['./modal-cadastro-cadencia.component.scss']
})
export class ModalCadastroCadenciaComponent {
  cadenciaId: string | null = null;
  cadencia: Cadencia = {
    nome: '',
    descricao: '',
    etapas: []
  };

  novaEtapa: Etapa = {
    dia: 1,
    canal: '',
    mensagem: ''
  };

  constructor(
    private cadenciaService: CadenciaService,
    private dialogRef: MatDialogRef<ModalCadastroCadenciaComponent>
  ) {}

  async adicionarEtapa() {
    try {
      // Se ainda não criou a cadência, cria no Firebase e pega o ID
      if (!this.cadenciaId) {
        this.cadenciaId = await this.cadenciaService.criarCadencia({
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao,
          etapas: []
        });
      }

      // Adiciona etapa no documento já criado
      await this.cadenciaService.adicionarEtapa(this.cadenciaId, this.novaEtapa);
      alert('Etapa salva com sucesso!');

      // Limpa form etapa
      this.novaEtapa = { dia: 1, canal: '', mensagem: '' };

    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      alert('Erro ao adicionar etapa');
    }
  }

  fechar() {
    this.dialogRef.close();
  }
}
