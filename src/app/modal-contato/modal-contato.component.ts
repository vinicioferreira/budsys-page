import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
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
    private fb: FormBuilder
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

      emailjs.send(
        'service_960gg1r',               // ID do serviço (EmailJS)
        'template_w60nnqq',             // ID do template
        templateParams,
        'vowCrOusn6wX9y7rC'             // Public Key (API key)
      ).then(() => {
        alert('Email enviado com sucesso!');
        console.log('Dados enviados', templateParams);
        this.dialogRef.close();

        // Envia para o Make via Webhook
        fetch('https://hook.us2.make.com/dje1pthoad8p8lajsgjls5xmvm5d4hv7', {
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
    }
  }
}
