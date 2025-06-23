import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ContatoService } from '../../services/contato.service';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-modal-contato',
  templateUrl: './modal-contato.component.html',
  styleUrls: ['./modal-contato.component.scss']
})
export class ModalContatoComponent {
  contatoForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ModalContatoComponent>,
    private fb: FormBuilder,
    private contatoService: ContatoService
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

  enviar(): void {
    if (this.contatoForm.valid) {
      const templateParams = {
        nome: this.contatoForm.value.nome || '',
        email: this.contatoForm.value.email || '',
        telefone: this.contatoForm.value.telefone || '',
        empresa: this.contatoForm.value.empresa || '',
        mensagem: this.contatoForm.value.mensagem || ''
      };

      // Salva no Firestore usando o service
      this.contatoService.salvarContato(templateParams)
        .then(() => {
          console.log('Contato salvo no Firestore');
        })
        .catch((error) => {
          console.error('Erro ao salvar no Firestore:', error);
          alert('Erro ao salvar no sistema. Verifique sua conexão.');
        });

/*      // Envia email
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
*/   }
  }
}
