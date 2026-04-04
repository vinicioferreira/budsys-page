import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CadenciaService } from '../../../services/cadencia.service';
import { ContatoService } from '../../../services/contato.service';
import { AgendaService } from '../../../services/agenda.service';

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
    mensagem: '',
    canal: ''
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
      const dadosParaSalvar = {
        nome: this.cliente.nome,
        email: this.cliente.email,
        telefone: this.cliente.telefone,
        empresa: this.cliente.empresa,
        mensagem: this.cliente.mensagem,
        canal: this.cliente.canal
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

  fechar(): void {
    this.dialogRef.close(null);
  }
}