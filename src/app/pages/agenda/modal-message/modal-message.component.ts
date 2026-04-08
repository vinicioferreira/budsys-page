import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AgendaService } from '../../../services/agenda.service';
import { AgendaAnotacao } from '../../../interfaces/agenda-group';
import { STATUS_COMERCIAL, getStatusColor, getStatusLabel } from '../../../shared/status-comercial';

@Component({
  selector: 'app-modal-message',
  templateUrl: './modal-message.component.html',
  styleUrls: ['./modal-message.component.scss']
})
export class ModalMessageComponent {
  modoReagendar = false;
  novaDataStr: string = '';
  novaHora: string = '09:00';

  editandoMensagem = false;
  mensagemEditada: string = '';

  editandoAcaoIndex: number | null = null;
  acaoMensagemEditada: string = '';

  novaAnotacao: string = '';

  hasChanges = false;

  readonly statusList = STATUS_COMERCIAL;

  constructor(
    private agendaService: AgendaService,
    public dialogRef: MatDialogRef<ModalMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mensagemEditada =
      data?.acoes?.[0]?.mensagem ||
      data?.mensagem ||
      '';
  }

  get primeiraAcaoCanal(): string {
    return this.data?.acoes?.[0]?.canal || this.data?.canal || '';
  }

  get primeiraAcaoMensagem(): string {
    return this.data?.acoes?.[0]?.mensagem || this.data?.mensagem || '';
  }

  get isManual(): boolean {
    return this.primeiraAcaoCanal?.toLowerCase() === 'manual';
  }

  getCanalLabel(canal: string): string {
    const value = (canal || '').toLowerCase();
    switch (value) {
      case 'ligacao': case 'ligar': return 'Ligação';
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'E-mail';
      case 'reuniao': case 'reunião': case 'reuniao_agendada': return 'Reunião';
      case 'manual': return 'Manual';
      default: return canal || 'Atividade';
    }
  }

  getCondicaoLabel(condicao: string): string {
    switch (condicao) {
      case 'se_nao_atender': return 'Se não atender';
      case 'se_nao_responder': return 'Se não responder';
      default: return '';
    }
  }

  getMensagemPersonalizada(): string {
    const textoBase = this.primeiraAcaoMensagem || '';
    return textoBase.replace(/{{\s*(\w+)\s*}}/g, (_match: string, chave: string) => {
      return this.data?.[chave] || '';
    });
  }

  fechar(): void {
    this.dialogRef.close(this.hasChanges);
  }

  abrirWhatsapp(): void {
    const telefone = this.data?.contatoTelefone?.replace(/\D/g, '');
    if (!telefone) { alert('Telefone não informado!'); return; }
    const texto = encodeURIComponent(
      this.editandoMensagem ? this.mensagemEditada : this.getMensagemPersonalizada()
    );
    window.open(`https://wa.me/55${telefone}?text=${texto}`, '_blank');
  }

  abrirEmail(): void {
    const email = this.data?.contatoEmail || this.data?.email || '';
    if (!email) { alert('E-mail não informado!'); return; }
    const mensagem = this.editandoMensagem
      ? this.mensagemEditada
      : this.getMensagemPersonalizada();
    navigator.clipboard.writeText(mensagem || '');
    window.open('https://mail.zoho.com/zm/#compose', '_blank');
  }

  canalEh(tipo: string): boolean {
    return this.primeiraAcaoCanal?.toLowerCase() === tipo.toLowerCase();
  }

  // ─── Status comercial ─────────────────────────────────────────────────────

  selecionarStatus(novoStatus: string): void {
    if (!this.data?.id || this.data.status === novoStatus) return;
    this.data.status = novoStatus;
    this.hasChanges = true;
    this.agendaService.atualizarStatusAtividade(
      this.data.id, novoStatus, undefined, this.data.contatoId
    ).catch(err => console.error('Erro ao atualizar status:', err));
  }

  getStatusColor(status: string): string { return getStatusColor(status); }
  getStatusLabel(status: string): string { return getStatusLabel(status); }

  // ─── Ações do dia ─────────────────────────────────────────────────────────

  async toggleAcaoFeita(index: number): Promise<void> {
    if (!this.data?.acoes?.[index] || !this.data?.id) return;
    this.data.acoes[index].feito = !this.data.acoes[index].feito;
    this.hasChanges = true;
    try {
      await this.agendaService.atualizarAcoesAtividade(this.data.id, this.data.acoes);
    } catch (error) {
      console.error('Erro ao atualizar ação:', error);
      this.data.acoes[index].feito = !this.data.acoes[index].feito;
    }
  }

  abrirEdicaoAcao(index: number): void {
    this.editandoAcaoIndex = index;
    this.acaoMensagemEditada = this.data.acoes[index]?.mensagem || '';
  }

  cancelarEdicaoAcao(): void {
    this.editandoAcaoIndex = null;
    this.acaoMensagemEditada = '';
  }

  async salvarEdicaoAcao(index: number): Promise<void> {
    if (!this.data?.id) return;
    const mensagem = this.acaoMensagemEditada.trim();
    if (!mensagem) { alert('A mensagem não pode ficar vazia.'); return; }
    this.data.acoes[index].mensagem = mensagem;
    this.hasChanges = true;
    try {
      await this.agendaService.atualizarAcoesAtividade(this.data.id, this.data.acoes);
      this.editandoAcaoIndex = null;
      this.acaoMensagemEditada = '';
    } catch (error) {
      console.error('Erro ao salvar mensagem da ação:', error);
      alert('Erro ao salvar mensagem da ação.');
    }
  }

  // ─── Mensagem única (fallback sem acoes[]) ────────────────────────────────

  abrirEdicaoMensagem(): void {
    this.editandoMensagem = true;
    this.mensagemEditada = this.primeiraAcaoMensagem;
  }

  cancelarEdicaoMensagem(): void {
    this.editandoMensagem = false;
    this.mensagemEditada = this.primeiraAcaoMensagem;
  }

  async salvarMensagem(): Promise<void> {
    if (!this.data?.id) { alert('ID da atividade não encontrado.'); return; }
    const mensagem = (this.mensagemEditada || '').trim();
    if (!mensagem) { alert('A mensagem não pode ficar vazia.'); return; }
    try {
      await this.agendaService.atualizarMensagemAtividade(this.data.id, mensagem);
      if (this.data?.acoes?.length) this.data.acoes[0].mensagem = mensagem;
      this.data.mensagem = mensagem;
      this.mensagemEditada = mensagem;
      this.editandoMensagem = false;
      this.hasChanges = true;
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      alert('Erro ao salvar mensagem.');
    }
  }

  // ─── Log de anotações ─────────────────────────────────────────────────────

  getAnotacoes(): AgendaAnotacao[] {
    return this.data?.anotacaoLog || [];
  }

  formatarData(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear()).slice(2);
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
  }

  async adicionarNota(): Promise<void> {
    const texto = this.novaAnotacao.trim();
    if (!texto || !this.data?.id) return;
    try {
      const nota = await this.agendaService.adicionarAnotacao(this.data.id, texto);
      if (!this.data.anotacaoLog) this.data.anotacaoLog = [];
      this.data.anotacaoLog.push(nota);
      this.novaAnotacao = '';
      this.hasChanges = true;
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      alert('Erro ao adicionar anotação.');
    }
  }

  // ─── Reagendamento ────────────────────────────────────────────────────────

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
    if (!this.data?.id) { alert('ID da atividade não encontrado.'); return; }
    if (!this.data?.contatoId) { alert('Contato não encontrado para deslocar a cadência.'); return; }
    if (!this.novaDataStr || !this.novaHora) { alert('Preencha data e horário.'); return; }
    const [year, month, day] = this.novaDataStr.split('-').map(Number);
    const [hour, minute] = this.novaHora.split(':').map(Number);
    const novaData = new Date(year, month - 1, day, hour, minute, 0);
    try {
      await this.agendaService.reagendarAtividadeComDeslocamento(
        this.data.id, this.data.contatoId, novaData,
        `Reagendado para ${this.novaDataStr} ${this.novaHora}`
      );
      alert('Atividade reagendada e próximas atividades deslocadas com sucesso.');
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao reagendar atividade:', error);
      alert('Erro ao reagendar atividade.');
    }
  }

  // ─── Exclusão ─────────────────────────────────────────────────────────────

  async excluirAtividadeAtual(): Promise<void> {
    if (!this.data?.id) { alert('ID da atividade não encontrado.'); return; }
    if (!confirm('Deseja realmente excluir esta atividade?')) return;
    try {
      await this.agendaService.excluirAtividade(this.data.id);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      alert('Erro ao excluir atividade.');
    }
  }

  async excluirProximasAtividades(): Promise<void> {
    if (!this.data?.contatoId) { alert('Contato não encontrado.'); return; }
    if (!confirm('Deseja excluir as próximas atividades deste contato?')) return;
    try {
      await this.agendaService.excluirAtividadesFuturasPorContato(
        this.data.contatoId, this.data.id
      );
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao excluir próximas atividades:', error);
      alert('Erro ao excluir próximas atividades.');
    }
  }
}
