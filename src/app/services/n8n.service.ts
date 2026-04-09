import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class N8nService {
  private webhookUrl = 'http://localhost:5678/webhook-test/89ec3122-867b-4e91-ac98-e6a3956f2ecc';

  constructor(private http: HttpClient) {}

  async enviarMensagem(payload: {
    canal: string;
    telefone?: string;
    email?: string;
    mensagem: string;
    atividadeId: string;
  }): Promise<any> {
    return firstValueFrom(this.http.post(this.webhookUrl, payload));
  }
}
