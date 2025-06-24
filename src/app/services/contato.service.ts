import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, serverTimestamp } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContatoService {
  constructor(private firestore: Firestore) {}

  async salvarContato(dados: any): Promise<void> {
    const contatosRef = collection(this.firestore, 'contatos');

    // Salva o contato no Firestore
    const docRef = await addDoc(contatosRef, {
      ...dados,
      dataCadastro: serverTimestamp()
    });

    console.log('Contato salvo com ID:', docRef.id);

    // Gera e salva as atividades da cadência
    await this.salvarCadencia(docRef.id, dados.nome);
  }

  listarContatos(): Observable<any[]> {
    const contatosRef = collection(this.firestore, 'contatos');
    return from(
      getDocs(contatosRef).then(snapshot =>
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      )
    );
  }

  private gerarCadencia(nome: string, contatoId: string, dataBase: Date): any[] {
    const fluxos = [
      { dia: 1, canal: 'email', mensagem: `Olá ${nome}, tudo bem? Recebi seus dados e quero apresentar nossa solução.` },
      { dia: 2, canal: 'telefone', mensagem: `Ligação para apresentar proposta ao ${nome}.` },
      { dia: 3, canal: 'whatsapp', mensagem: `Oi ${nome}, vi que você se interessou. Posso te enviar mais informações?` },
      { dia: 4, canal: 'telefone', mensagem: `Nova tentativa de ligação para ${nome}.` },
      { dia: 8, canal: 'linkedin', mensagem: `Mensagem para ${nome} no LinkedIn.` },
      { dia: 9, canal: 'whatsapp', mensagem: `Novo contato via WhatsApp com ${nome}.` },
      { dia: 10, canal: 'email', mensagem: `Último contato por email com ${nome}.` }
    ];

    return fluxos.map(f => {
      const data = new Date(dataBase);
      data.setDate(data.getDate() + f.dia);
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

  private async salvarCadencia(contatoId: string, nome: string): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const baseDate = new Date();

    const cadencia = this.gerarCadencia(nome, contatoId, baseDate);

    const promises = cadencia.map(atividade => addDoc(atividadesRef, atividade));
    await Promise.all(promises);

    console.log('Atividades da cadência salvas no Firestore!');
  }
}
