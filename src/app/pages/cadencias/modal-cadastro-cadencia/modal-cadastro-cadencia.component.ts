import { Component, Inject, OnInit } from '@angular/core';
import { Cadencia, Etapa } from '../../../interfaces/cadencia';
import { CadenciaService } from '../../../services/cadencia.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-cadastro-cadencia',
  templateUrl: './modal-cadastro-cadencia.component.html',
  styleUrls: ['./modal-cadastro-cadencia.component.scss']
})
export class ModalCadastroCadenciaComponent implements OnInit {
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

  etapaIndex: number | null = null;

  constructor(
    private cadenciaService: CadenciaService,
    private dialogRef: MatDialogRef<ModalCadastroCadenciaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cadencia?: Cadencia, etapa?: Etapa, etapaIndex?: number }
  ) {}

  ngOnInit(): void {
    if (this.data?.cadencia) {
      this.cadencia = { ...this.data.cadencia };
      this.cadenciaId = this.cadencia.id;
    }

    if (this.data?.etapa) {
      this.novaEtapa = { ...this.data.etapa };
      this.etapaIndex = this.data.etapaIndex ?? null;
    }
  }

  async salvarCadencia() {
    try {
      if (this.cadenciaId) {
        await this.cadenciaService.editarCadencia(this.cadenciaId, {
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao
        });
      } else {
        this.cadenciaId = await this.cadenciaService.criarCadencia({
          id: this.cadencia.id,
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao,
          etapas: []
        });
      }

      alert('✅ Cadência salva com sucesso!');
      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Erro ao salvar cadência:', error);
      alert('Erro ao salvar cadência');
    }
  }

  async adicionarOuEditarEtapa() {
    try {
      if (!this.cadenciaId) {
        this.cadenciaId = await this.cadenciaService.criarCadencia({
          id: this.cadencia.id,
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao,
          etapas: []
        });
      }

      if (this.etapaIndex !== null) {
        // Editar etapa existente
        await this.cadenciaService.editarEtapa(this.cadenciaId, this.etapaIndex, this.novaEtapa);
        alert('✅ Etapa editada com sucesso!');
      } else {
        // Adicionar nova etapa
        await this.cadenciaService.adicionarEtapa(this.cadenciaId, this.novaEtapa);
        alert('✅ Etapa adicionada com sucesso!');
      }

      this.dialogRef.close(true);

    } catch (error) {
      console.error('❌ Erro ao salvar etapa:', error);
      alert('Erro ao salvar etapa');
    }
  }

  fechar() {
    this.dialogRef.close(this.cadenciaId ? true : false);
  }
}
