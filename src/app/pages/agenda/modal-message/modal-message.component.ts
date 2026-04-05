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

  statusList = [
    { label: 'Pendente', value: 'pendente', color: '#e53935' },
    { label: 'Em andamento', value: 'andamento', color: '#fb8c00' },
    { label: 'Feito', value: 'feito', color: '#43a047' }
  ];
}