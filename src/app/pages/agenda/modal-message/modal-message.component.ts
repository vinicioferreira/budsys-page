import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AgendaService } from '../../../services/agenda.service';

@Component({
  selector: 'app-modal-message',
  templateUrl: './modal-message.component.html',
  styleUrls: ['./modal-message.component.scss']
})
export class ModalMessageComponent {
  anotacao: string = '';
  modoReagendar = false;
  novaDataStr: string = '';
  novaHora: string = '09:00';

  editandoMensagem = false;
  mensagemEditada: string = '';

  editandoAnotacao = false;
  anotacaoEditada: string = '';

  constructor(
    private agendaService: AgendaService,
    public dialogRef: MatDialogRef<ModalMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mensagemEditada = data?.mensagem || '';
    this.anotacaoEditada = data?.anotacao || '';
    this.anotacao = data?.anotacao || '';
  }

  get isManual(): boolean {
    return this.data?.canal?.toLowerCase() === 'manual';
  }

  getMensagemPersonalizada(): string {
    return (this.data.mensagem || '').replace(/{{\s*(\w+)\s*}}/g, (_match: string, chave: string) => {
      return this.data[chave] || '';
    });
  }

  copiarMensagem(): void {
    const texto = this.editandoMensagem ? this.mensagemEditada : this.getMensagemPersonalizada();
    navigator.clipboard.writeText(texto || '');
    alert('Mensagem copiada para a área de transferência!');
  }

  abrirWhatsapp(): void {
    const telefone = this.data.contatoTelefone?.replace(/\D/g, '');
    if (!telefone) {
      alert('Telefone não informado!');
      return;
    }

    const texto = encodeURIComponent(
      this.editandoMensagem ? this.mensagemEditada : this.getMensagemPersonalizada()
    );

    const link = `https://wa.me/55${telefone}?text=${texto}`;
    window.open(link, '_blank');
  }

  abrirEmail(): void {
    const email = this.data.contatoEmail || this.data.email || '';

    if (!email) {
      alert('E-mail não informado!');
      return;
    }

    const mensagem = this.editandoMensagem ? this.mensagemEditada : this.getMensagemPersonalizada();
    navigator.clipboard.writeText(mensagem || '');
    window.open('https://mail.zoho.com/zm/#compose', '_blank');
  }

  abrirZoho(): void {
    this.copiarMensagem();
    window.open('https://mail.zoho.com/zm/#compose', '_blank');
  }

  canalEh(tipo: string): boolean {
    return this.data.canal?.toLowerCase() === tipo.toLowerCase();
  }

  atualizarStatus(novoStatus: string): void {
    if (!this.data.id) {
      alert('ID do documento não encontrado.');
      return;
    }

    this.data.status = novoStatus;

    this.agendaService.atualizarStatusAtividade(this.data.id, novoStatus, this.anotacaoEditada)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((error) => {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status.');
      });
  }

  abrirReagendamento(): void {
    this.modoReagendar = true;

    if (this.data?.dataPrevista) {
      const dt = new Date(this.data.dataPrevista);
      this.novaDataStr = dt.toISOString().substring(0, 10);
      this.novaHora = dt.toTimeString().substring(0, 5);
    } else {
      this.novaDataStr = new Date().toISOString().substring(0, 10);
      this.novaHora = '09:00';
    }
  }

  cancelarReagendamento(): void {
    this.modoReagendar = false;
  }

  async reagendar(): Promise<void> {
    if (!this.data?.id) {
      alert('ID da atividade não encontrado.');
      return;
    }

    if (!this.data?.contatoId) {
      alert('Contato não encontrado para deslocar a cadência.');
      return;
    }

    if (!this.novaDataStr || !this.novaHora) {
      alert('Preencha data e horário.');
      return;
    }

    const [year, month, day] = this.novaDataStr.split('-').map(Number);
    const [hour, minute] = this.novaHora.split(':').map(Number);

    const novaData = new Date(year, month - 1, day, hour, minute, 0);

    try {
      await this.agendaService.reagendarAtividadeComDeslocamento(
        this.data.id,
        this.data.contatoId,
        novaData,
        this.anotacaoEditada || `Reagendado para ${this.novaDataStr} ${this.novaHora}`
      );

      alert('Atividade reagendada e próximas atividades deslocadas com sucesso.');
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao reagendar atividade:', error);
      alert('Erro ao reagendar atividade.');
    }
  }

  abrirEdicaoMensagem(): void {
    this.editandoMensagem = true;
    this.mensagemEditada = this.data?.mensagem || '';
  }

  cancelarEdicaoMensagem(): void {
    this.editandoMensagem = false;
    this.mensagemEditada = this.data?.mensagem || '';
  }

  async salvarMensagem(): Promise<void> {
    if (!this.data?.id) {
      alert('ID da atividade não encontrado.');
      return;
    }

    const mensagem = (this.mensagemEditada || '').trim();

    if (!mensagem) {
      alert('A mensagem não pode ficar vazia.');
      return;
    }

    try {
      await this.agendaService.atualizarMensagemAtividade(this.data.id, mensagem);

      this.data.mensagem = mensagem;
      this.mensagemEditada = mensagem;
      this.editandoMensagem = false;

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      alert('Erro ao salvar mensagem.');
    }
  }

  abrirEdicaoAnotacao(): void {
    this.editandoAnotacao = true;
    this.anotacaoEditada = this.data?.anotacao || '';
  }

  cancelarEdicaoAnotacao(): void {
    this.editandoAnotacao = false;
    this.anotacaoEditada = this.data?.anotacao || '';
  }

  async salvarAnotacao(): Promise<void> {
    if (!this.data?.id) {
      alert('ID da atividade não encontrado.');
      return;
    }

    const texto = (this.anotacaoEditada || '').trim();

    if (!texto) {
      alert('Digite uma anotação antes de salvar.');
      return;
    }

    try {
      await this.agendaService.atualizarAnotacaoAtividade(this.data.id, texto);

      this.data.anotacao = texto;
      this.anotacao = texto;
      this.anotacaoEditada = texto;
      this.editandoAnotacao = false;

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
      alert('Erro ao salvar anotação.');
    }
  }

  getStatusColor(status: string): string {
    return this.statusList.find(s => s.value === status)?.color || '#999';
  }

  getStatusLabel(status: string): string {
    return this.statusList.find(s => s.value === status)?.label || status;
  }

  statusList = [
    { label: 'Novo', value: 'novo', color: '#546e7a' },
    { label: 'Tentando contato', value: 'tentando_contato', color: '#e53935' },
    { label: 'Contatado', value: 'contatado', color: '#fb8c00' },
    { label: 'Reunião agendada', value: 'reuniao_agendada', color: '#1e88e5' },
    { label: 'Proposta enviada', value: 'proposta_enviada', color: '#8e24aa' },
    { label: 'Fechado', value: 'fechado', color: '#43a047' },
    { label: 'Perdido', value: 'perdido', color: '#757575' }
  ];
}