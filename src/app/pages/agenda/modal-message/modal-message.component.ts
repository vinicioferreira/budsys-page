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

  constructor(
    private agendaService: AgendaService,
    public dialogRef: MatDialogRef<ModalMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  get isManual(): boolean {
    return this.data?.canal?.toLowerCase() === 'manual';
  }

  getMensagemPersonalizada(): string {
    return (this.data.mensagem || '').replace(/{{\s*(\w+)\s*}}/g, (_match: string, chave: string) => {
      return this.data[chave] || '';
    });
  }

  copiarMensagem(): void {
    navigator.clipboard.writeText(this.getMensagemPersonalizada());
    alert('Mensagem copiada para a área de transferência!');
  }

  abrirWhatsapp(): void {
    const telefone = this.data.contatoTelefone?.replace(/\D/g, '');
    if (!telefone) {
      alert('Telefone não informado!');
      return;
    }

    const texto = encodeURIComponent(this.getMensagemPersonalizada());
    const link = `https://wa.me/55${telefone}?text=${texto}`;
    window.open(link, '_blank');
  }

  abrirEmail(): void {
    const email = this.data.contatoEmail || this.data.email || '';
    const assunto = encodeURIComponent('Mensagem para você');
    const corpo = encodeURIComponent(this.getMensagemPersonalizada());

    if (!email) {
      alert('E-mail não informado!');
      return;
    }

    const mailtoLink = `mailto:${email}?subject=${assunto}&body=${corpo}`;
    window.open(mailtoLink, '_blank');
  }

  abrirZoho(): void {
    this.copiarMensagem();
    alert('Abrindo Zoho Mail...\nCole a mensagem no corpo do e-mail.');
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

    this.agendaService.atualizarStatusAtividade(this.data.id, novoStatus, this.anotacao)
      .then(() => {
        console.log('✅ Status atualizado para', novoStatus);
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

    if (!this.novaDataStr || !this.novaHora) {
      alert('Preencha data e horário.');
      return;
    }

    const [year, month, day] = this.novaDataStr.split('-').map(Number);
    const [hour, minute] = this.novaHora.split(':').map(Number);

    const novaData = new Date(year, month - 1, day, hour, minute, 0);

    try {
      await this.agendaService.reagendarAtividade(
        this.data.id,
        novaData,
        this.anotacao || `Reagendado para ${this.novaDataStr} ${this.novaHora}`
      );

      alert('Reagendado com sucesso.');
      this.dialogRef.close(true);
    } catch (error) {
      console.error(error);
      alert('Erro ao reagendar.');
    }
  }

  statusList = [
    { label: 'Pendente', value: 'pendente', color: '#e53935' },
    { label: 'Em andamento', value: 'andamento', color: '#fb8c00' },
    { label: 'Feito', value: 'feito', color: '#43a047' }
  ];
}