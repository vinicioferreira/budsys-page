import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CadenciaService } from '../../../services/cadencia.service';
import { ContatoService } from '../../../services/contato.service';
import { AgendaService } from '../../../services/agenda.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-modal-cadastro-cliente-potencial',
  templateUrl: './modal-cadastro-cliente-potencial.component.html',
  styleUrls: ['./modal-cadastro-cliente-potencial.component.scss']
})
export class ModalCadastroClientePotencialComponent implements OnInit {
  cliente: any = {
    id: null,
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cnpj: '',
    cidade: '',
    uf: '',
    mensagem: '',
    canal: '',
    contatarEm: null as Date | null,
    observacaoContatar: ''
  };

  listaCanais: any[] = [];
  modoEdicao = false;

  constructor(
    private dialogRef: MatDialogRef<ModalCadastroClientePotencialComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cadenciaService: CadenciaService,
    private contatoService: ContatoService,
    private agendaService: AgendaService
  ) {
    if (data) {
      this.cliente = { ...this.cliente, ...data };
      this.modoEdicao = !!data.id;
      // Converte Timestamp do Firestore → Date para o datepicker
      if (data.contatarEm?.toDate) {
        this.cliente.contatarEm = data.contatarEm.toDate();
      }
    }
  }

  ngOnInit(): void {
    this.carregarCanais();
    console.log('📌 Dados recebidos no modal:', this.data);
    console.log('📌 Cliente no modal:', this.cliente);
    console.log('📌 Modo edição:', this.modoEdicao);
  }

  carregarCanais(): void {
    this.cadenciaService.listarCadencias().subscribe(canais => {
      this.listaCanais = canais || [];
    });
  }

  async salvar(): Promise<void> {
    try {
      const dadosParaSalvar: any = {
        nome: this.cliente.nome,
        email: this.cliente.email,
        telefone: this.cliente.telefone,
        empresa: this.cliente.empresa,
        cnpj: this.cliente.cnpj || '',
        cidade: this.cliente.cidade || '',
        uf: this.cliente.uf || '',
        mensagem: this.cliente.mensagem,
        canal: this.cliente.canal,
        observacaoContatar: this.cliente.observacaoContatar || '',
        contatarEm: this.cliente.contatarEm
          ? Timestamp.fromDate(new Date(this.cliente.contatarEm))
          : null,
      };

      let contatoId = this.cliente.id;

      if (this.modoEdicao && this.cliente.id) {
        console.log('✏️ Atualizando contato:', this.cliente.id, dadosParaSalvar);
        await this.contatoService.atualizarContato(this.cliente.id, dadosParaSalvar);
      } else {
        console.log('🆕 Criando contato:', dadosParaSalvar);
        contatoId = await this.contatoService.salvarContato(dadosParaSalvar);
      }

      this.dialogRef.close(contatoId);
    } catch (error) {
      console.error('❌ Erro real ao salvar cliente:', error);
      alert('❌ Ocorreu um erro ao salvar o cliente');
    }
  }

  definirData(meses: number): void {
    const d = new Date();
    d.setMonth(d.getMonth() + meses);
    this.cliente.contatarEm = d;
  }

  fechar(): void {
    this.dialogRef.close(null);
  }
}