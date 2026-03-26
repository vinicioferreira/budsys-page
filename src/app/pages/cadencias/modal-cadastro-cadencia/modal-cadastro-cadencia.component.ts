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

        const etapaPreenchida = this.novaEtapa.canal.trim() !== '' || this.novaEtapa.mensagem.trim() !== '';

        if (etapaPreenchida) {
          if (this.etapaIndex !== null) {
            // Edição da etapa
            await this.cadenciaService.editarEtapa(this.cadenciaId, this.etapaIndex, this.novaEtapa);
            alert('✅ Cadência e etapa editadas com sucesso!');
          } else {
            // Nova etapa
            await this.cadenciaService.adicionarEtapa(this.cadenciaId, this.novaEtapa);
            alert('✅ Cadência editada e nova etapa adicionada com sucesso!');
          }
        } else {
          alert('✅ Cadência editada com sucesso!');
        }

      } else {
        // Nova cadência
        this.cadenciaId = await this.cadenciaService.criarCadencia({
          id: this.cadencia.id,
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao,
          etapas: []
        });

        const etapaPreenchida = this.novaEtapa.canal.trim() !== '' || this.novaEtapa.mensagem.trim() !== '';

        if (etapaPreenchida) {
          await this.cadenciaService.adicionarEtapa(this.cadenciaId, this.novaEtapa);
          alert('✅ Cadência criada e etapa adicionada com sucesso!');
        } else {
          alert('✅ Cadência criada com sucesso!');
        }
      }

      this.dialogRef.close(true);

    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('Erro ao salvar cadência/etapa');
    }
  }

  fechar() {
    this.dialogRef.close(this.cadenciaId ? true : false);
  }
}
