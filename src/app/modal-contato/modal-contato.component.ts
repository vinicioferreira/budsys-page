import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
      console.log(this.contatoForm.value); // Por enquanto só mostra no console
      this.dialogRef.close();
    }
  }
}
