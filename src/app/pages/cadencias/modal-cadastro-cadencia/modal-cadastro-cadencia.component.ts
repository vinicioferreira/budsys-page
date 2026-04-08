import { Component, Inject, OnInit } from '@angular/core';
import { Cadencia, Etapa, AcaoEtapa } from '../../../interfaces/cadencia';
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
    acoes: [
      {
        canal: '',
        mensagem: '',
        condicao: 'normal'
      }
    ]
  };

  etapaIndex: number | null = null;

  constructor(
    private cadenciaService: CadenciaService,
    private dialogRef: MatDialogRef<ModalCadastroCadenciaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cadencia?: Cadencia, etapa?: Etapa, etapaIndex?: number }
  ) { }

  ngOnInit(): void {
    if (this.data?.cadencia) {
      this.cadencia = {
        ...this.data.cadencia,
        etapas: this.data.cadencia.etapas?.map(etapa => ({
          dia: etapa.dia,
          acoes: etapa.acoes?.map(acao => ({ ...acao })) || []
        })) || []
      };

      this.cadenciaId = this.cadencia.id;
    }

    if (this.data?.etapa) {
      this.novaEtapa = {
        dia: this.data.etapa.dia,
        acoes: this.data.etapa.acoes?.length
          ? this.data.etapa.acoes.map(acao => ({ ...acao }))
          : [{
            canal: '',
            mensagem: '',
            condicao: 'normal'
          }]
      };

      this.etapaIndex = this.data.etapaIndex ?? null;
    }
  }

  adicionarAcao(): void {
    this.novaEtapa.acoes.push({
      canal: '',
      mensagem: '',
      condicao: 'normal'
    });
  }

  removerAcao(index: number): void {
    if (this.novaEtapa.acoes.length > 1) {
      this.novaEtapa.acoes.splice(index, 1);
    }
  }

  private etapaPreenchida(): boolean {
    return this.novaEtapa.acoes.some(
      acao => (acao.canal?.trim() || '') !== '' || (acao.mensagem?.trim() || '') !== ''
    );
  }

  private limparAcoesVazias(): Etapa {
    return {
      dia: this.novaEtapa.dia,
      acoes: this.novaEtapa.acoes
        .filter(acao => (acao.canal?.trim() || '') !== '' || (acao.mensagem?.trim() || '') !== '')
        .map(acao => ({
          canal: acao.canal?.trim() || '',
          mensagem: acao.mensagem?.trim() || '',
          condicao: acao.condicao || 'normal'
        }))
    };
  }

  async salvarCadencia() {
    try {
      const etapaTratada = this.limparAcoesVazias();
      const etapaPreenchida = etapaTratada.acoes.length > 0;

      if (this.cadenciaId) {
        await this.cadenciaService.editarCadencia(this.cadenciaId, {
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao
        });

        if (etapaPreenchida) {
          if (this.etapaIndex !== null) {
            await this.cadenciaService.editarEtapa(this.cadenciaId, this.etapaIndex, etapaTratada);
            alert('✅ Cadência e etapa editadas com sucesso!');
          } else {
            await this.cadenciaService.adicionarEtapa(this.cadenciaId, etapaTratada);
            alert('✅ Cadência editada e nova etapa adicionada com sucesso!');
          }
        } else {
          alert('✅ Cadência editada com sucesso!');
        }
      } else {
        this.cadenciaId = await this.cadenciaService.criarCadencia({
          id: this.cadencia.id,
          nome: this.cadencia.nome,
          descricao: this.cadencia.descricao,
          etapas: []
        });

        if (etapaPreenchida) {
          await this.cadenciaService.adicionarEtapa(this.cadenciaId, etapaTratada);
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