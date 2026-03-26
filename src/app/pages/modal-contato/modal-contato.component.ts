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

  enviar(): void {
  if (this.contatoForm.valid) {
    const templateParams = {
      nome: this.contatoForm.value.nome || '',
      email: this.contatoForm.value.email || '',
      telefone: this.contatoForm.value.telefone || '',
      empresa: this.contatoForm.value.empresa || '',
      mensagem: this.contatoForm.value.mensagem || ''
    };

    // Envia email
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

    // Salva o contato e já agenda
    this.contatoService.salvarContato(templateParams, 'Landing Page')
      .then((docId) => {
        console.log('✅ Contato salvo no Firestore, ID:', docId);
       const mensagem =
      `📩 Novo lead recebido - Site!

      👤 Nome: ${templateParams.nome}
      📧 Email: ${templateParams.email}
      📞 Telefone: ${templateParams.telefone}
      🏢 Empresa: ${templateParams.empresa || '---'}
      💬 Mensagem: ${templateParams.mensagem || '---'}`;


        // Envia mensagem de WhatsApp para o ADM
        this.http.post('https://us-central1-budsys.cloudfunctions.net/api/messaging/whatsapp', {
          to: '+553591569148', // Ex: 'whatsapp:+553591234567'
          message: mensagem
          }).subscribe({
            next: () => console.log('📲 Mensagem WhatsApp enviada com sucesso'),
            error: err => console.error('❌ Erro ao enviar WhatsApp:', err)
        });

        const cliente = {
          id: docId,
          ...templateParams,
          canal: 'Landing Page'
        };

        // Carrega a cadência fixa da Landing Page
        this.cadenciaService.getCadenciaById('ucRcAjk2ESrQIRYED8l7').then(cadencia => {
          console.log('📌 Cadência carregada:', cadencia);

          if (!cadencia || !cadencia.etapas || !Array.isArray(cadencia.etapas) || cadencia.etapas.length === 0) {
            console.warn('⚠ Cadência inválida ou sem etapas!');
            alert('⚠ Cadência da Landing Page sem etapas!');
            return;
          }

          // Gera atividades na agenda
          this.agendaService.gerarAtividadesDeCadencia(cadencia, cliente.id, cliente.nome, new Date());
          alert('✅ Dados enviados com sucesso!');
          this.dialogRef.close();
        }).catch(err => {
          console.error('Erro ao buscar cadência:', err);
          alert('❌ Erro ao buscar a cadência da Landing Page!');
        });

      })
      .catch((error) => {
        console.error('❌ Erro ao salvar no Firestore:', error);
        alert('❌ Erro ao salvar no sistema. Verifique sua conexão.');
      });
  } else {
    alert('⚠ Preencha os campos obrigatórios.');
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

