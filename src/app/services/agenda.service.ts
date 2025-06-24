import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  constructor(private firestore: Firestore) {}

  async gerarCadenciaParaContato(contatoId: string, nome: string): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const baseDate = new Date();

    const cadencia = this.gerarCadencia(nome, contatoId, baseDate);

    for (const atividade of cadencia) {
      await addDoc(atividadesRef, atividade);
    }

    console.log('Atividades da cadência criadas no Firestore!');
  }

  gerarCadencia(nome: string, contatoId: string, dataBase: Date): any[] {
    const fluxos = [
      { dia: 1, canal: 'email', hora: '09:00', mensagem: `Olá ${nome}, tudo bem? Recebi seus dados e quero apresentar nossa solução.` },
      { dia: 2, canal: 'telefone', hora: '14:00', mensagem: `Ligação para apresentar proposta ao ${nome}.` },
      { dia: 3, canal: 'whatsapp', hora: '11:00', mensagem: `Oi ${nome}, vi que você se interessou. Posso te enviar mais informações?` },
      { dia: 4, canal: 'telefone', hora: '14:00', mensagem: `Nova tentativa de ligação para ${nome}.` },
      { dia: 8, canal: 'linkedin', hora: '15:00', mensagem: `Mensagem para ${nome} no LinkedIn.` },
      { dia: 9, canal: 'whatsapp', hora: '11:00', mensagem: `Novo contato via WhatsApp com ${nome}.` },
      { dia: 10, canal: 'email', hora: '09:00', mensagem: `Último contato por email com ${nome}.` }
    ];

    return fluxos.map(f => {
      const data = new Date(dataBase);
      data.setDate(data.getDate() + f.dia);

      // Adiciona hora
      const [hour, minute] = f.hora.split(':').map(Number);
      data.setHours(hour, minute, 0, 0);

      return {
        contatoId: contatoId,
        contatoNome: nome,
        canal: f.canal,
        mensagem: f.mensagem,
        dataPrevista: data.toISOString(),
        status: 'pendente'
      };
    });
  }

  async listarAtividades(): Promise<any[]> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const snapshot = await getDocs(atividadesRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}
