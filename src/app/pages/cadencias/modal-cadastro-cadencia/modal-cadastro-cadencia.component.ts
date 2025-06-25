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
    id: '',
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
      // Cria a cadência no Firestore se ainda não foi criada
      if (!this.cadenciaId) {
        this.cadenciaId = await this.cadenciaService.criarCadencia({
          id: this.cadencia.id,
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao,
          etapas: []
        });
      }

      // Adiciona a etapa no documento
      await this.cadenciaService.adicionarEtapa(this.cadenciaId, this.novaEtapa);

      // Atualiza visualmente as etapas no modal se quiser exibir
      this.cadencia.etapas.push({ ...this.novaEtapa });

      // Limpa o formulário da nova etapa
      this.novaEtapa = { dia: 1, canal: '', mensagem: '' };

      alert('✅ Etapa salva com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao adicionar etapa:', error);
      alert('Erro ao adicionar etapa');
    }
  }

  fechar() {
    this.dialogRef.close(this.cadenciaId ? true : false);
  }
}
