import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ContatoService } from '../../services/contato.service';
import emailjs from '@emailjs/browser';
import { AgendaService } from '../../services/agenda.service';
import { CadenciaService } from '../../services/cadencia.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-modal-contato',
  templateUrl: './modal-contato.component.html',
  styleUrls: ['./modal-contato.component.scss']
})
export class ModalContatoComponent {
  contatoForm: FormGroup;
  cliente: any = {
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    mensagem: '',
    canal: 'Landing Page'
  };

  listaCanais: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalContatoComponent>,
    private fb: FormBuilder,
    private contatoService: ContatoService,
    private agendaService: AgendaService,
    private cadenciaService: CadenciaService,
    private http: HttpClient
  ) {
    this.contatoForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      empresa: [''],
      mensagem: ['']
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }

  vincularCanal(cliente: any) {
    console.log('🔍 Vinculando canal para cliente:', cliente);

    if (!cliente.canal || typeof cliente.canal !== 'string') {
      console.warn('⚠ Cliente sem canal válido, não dá pra vincular.');
      alert('⚠ Cliente sem canal válido!');
      return;
    }

    // Faz o match mais flexível no nome
    const canalSelecionado = this.listaCanais.find(c =>
      c.nome &&
      typeof c.nome === 'string' &&
      c.nome.toLowerCase().includes(cliente.canal.toLowerCase())
    );

    console.log('🔍 Canal selecionado na lista de cadências:', canalSelecionado);

    if (canalSelecionado) {
      this.cadenciaService.getCadenciaById(canalSelecionado.id).then(cadencia => {
        console.log('📌 Cadência carregada:', cadencia);

        if (!cadencia || !cadencia.etapas || !Array.isArray(cadencia.etapas) || cadencia.etapas.length === 0) {
          console.warn('⚠ Cadência inválida ou sem etapas!');
          alert('⚠ Cadência sem etapas!');
          return;
        }

        this.agendaService.gerarAtividadesDeCadencia(cadencia, cliente.id, cliente.nome, new Date());
        alert(`✅ Cadência vinculada e atividades criadas na agenda para o canal "${cliente.canal}"`);
      }).catch(err => {
        console.error('❌ Erro ao carregar a cadência:', err);
        alert('Erro ao carregar a cadência do Firestore.');
      });
    } else {
      console.warn(`⚠ Nenhuma cadência vinculada ao canal: "${cliente.canal}"`);
      alert(`⚠ Nenhuma cadência vinculada ao canal: "${cliente.canal}"`);
    }
  }

  async enviar(): Promise<void> {
    if (this.contatoForm.invalid) {
      alert('⚠ Preencha os campos obrigatórios.');
      return;
    }

    const templateParams = {
      nome: this.contatoForm.value.nome || '',
      email: this.contatoForm.value.email || '',
      telefone: this.contatoForm.value.telefone || '',
      empresa: this.contatoForm.value.empresa || '',
      mensagem: this.contatoForm.value.mensagem || '',
      canal: 'Landing Page'
    };

    try {
      // 1. Salva no Firestore
      const docId = await this.contatoService.salvarContato(templateParams, 'Landing Page');
      console.log('✅ Contato salvo no Firestore, ID:', docId);

      const cliente = {
        id: docId,
        ...templateParams,
        canal: 'Landing Page'
      };

      // 2. Busca a cadência fixa da Landing Page
      const cadencia = await this.cadenciaService.getCadenciaByNome(cliente.canal);
      console.log('📌 Cadência carregada:', cadencia);

      if (!cadencia || !cadencia.etapas || !Array.isArray(cadencia.etapas) || cadencia.etapas.length === 0) {
        alert('⚠ Cadência da Landing Page sem etapas!');
        return;
      }

      // 3. Gera atividades na agenda
      this.agendaService.gerarAtividadesDeCadencia(
        cadencia,
        cliente.id,
        cliente.nome,
        new Date()
      );

      // 4. Dispara email
      await emailjs.send(
        'service_960gg1r',
        'template_w60nnqq',
        {
          nome: templateParams.nome,
          email: templateParams.email,
          telefone: templateParams.telefone,
          empresa: templateParams.empresa,
          mensagem: templateParams.mensagem
        },
        'vowCrOusn6wX9y7rC'
      );

      console.log('✅ Email enviado com sucesso');

      // 5. Webhook Make
      fetch('https://hook.us2.make.com/xwmqyb6mv6jqqlszix0k6ivw6yjz0w7m', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateParams)
      }).catch(err => console.error('❌ Erro no webhook Make:', err));

      // 6. WhatsApp ADM
      const mensagem =
        `📩 Novo lead recebido - Site!
        👤 Nome: ${templateParams.nome}
        📧 Email: ${templateParams.email}
        📞 Telefone: ${templateParams.telefone}
        🏢 Empresa: ${templateParams.empresa || '---'}
        💬 Mensagem: ${templateParams.mensagem || '---'}`;

      this.http.post('https://us-central1-budsys.cloudfunctions.net/api/messaging/whatsapp', {
        to: '+553591569148',
        message: mensagem
      }).subscribe({
        next: () => console.log('📲 Mensagem WhatsApp enviada com sucesso'),
        error: err => console.error('❌ Erro ao enviar WhatsApp:', err)
      });

      alert('✅ Dados enviados com sucesso!');
      this.dialogRef.close(docId);

    } catch (error) {
      console.error('❌ Erro no envio do lead:', error);
      alert('❌ Erro ao enviar os dados. Tente novamente.');
    }
  }


  /*    // Envia email
        emailjs.send(
          'service_960gg1r',
          'template_w60nnqq',
          templateParams,
          'vowCrOusn6wX9y7rC'
        ).then(() => {
          alert('Email enviado com sucesso!');
          console.log('Dados enviados', templateParams);
          this.dialogRef.close();
  
          // Envia para o Make via Webhook
          fetch('https://hook.us2.make.com/xwmqyb6mv6jqqlszix0k6ivw6yjz0w7m', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateParams)
          });
  
        }, (error) => {
          console.error('Erro ao enviar:', error);
          alert('Erro ao enviar email. Tente novamente.');
        });
  */
}

