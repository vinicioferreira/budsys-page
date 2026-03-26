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
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    mensagem: '',
    canal: ''
  };

  listaCanais: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<ModalCadastroClientePotencialComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cadenciaService: CadenciaService,
    private contatoService: ContatoService,
    private agendaService: AgendaService
  ) {
    if (data) {
      this.cliente = { ...this.cliente, ...data }; // Garante campos definidos + dados recebidos
    }
  }

  ngOnInit(): void {
    this.carregarCanais();
  }

  carregarCanais(): void {
    this.cadenciaService.listarCadencias().subscribe(canais => {
      this.listaCanais = canais || [];
    });
  }

  vincularCanal(cliente: any) {
    console.log('🔍 Vinculando canal para cliente:', cliente);

    if (!cliente.canal || typeof cliente.canal !== 'string') {
      console.warn('⚠ Cliente sem canal válido, não dá pra vincular.');
      alert('⚠ Cliente sem canal válido!');
      return;
    }

    const canalSelecionado = this.listaCanais.find(c =>
      c.nome && typeof c.nome === 'string' &&
      c.nome.toLowerCase() === cliente.canal.toLowerCase()
    );

    console.log('🔍 Canal selecionado na lista de cadências:', canalSelecionado);

    if (canalSelecionado) {
      this.cadenciaService.getCadenciaById(canalSelecionado.cadenciaId).then(cadencia => {
        console.log('📌 Cadência carregada:', cadencia);

        if (!cadencia || !cadencia.etapas || !Array.isArray(cadencia.etapas) || cadencia.etapas.length === 0) {
          console.warn('⚠ Cadência inválida ou sem etapas!');
          alert('⚠ Cadência sem etapas!');
          return;
        }

        this.agendaService.gerarAtividadesDeCadencia(cadencia, cliente.id, cliente.nome, new Date());
        alert(`✅ Cadência vinculada e atividades criadas na agenda para o canal "${cliente.canal}"`);
      });
    } else {
      console.warn(`⚠ Nenhuma cadência vinculada ao canal: "${cliente.canal}"`);
      alert(`⚠ Nenhuma cadência vinculada ao canal: "${cliente.canal}"`);
    }
  }

  async salvar(): Promise<void> {
    try {
      const contatoId = await this.contatoService.salvarContato(this.cliente);
      alert('✅ Cliente salvo com sucesso!');
      this.dialogRef.close(contatoId);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('❌ Ocorreu um erro ao salvar o cliente');
    }
  }

  fechar(): void {
    this.dialogRef.close(null);
  }
}
