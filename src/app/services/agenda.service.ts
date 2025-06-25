import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  constructor(private firestore: Firestore) {}

  /**
   * Gera atividades no Firestore com base em uma cadência real (puxando etapas do banco)
   */
  async gerarAtividadesDeCadencia(cadencia: any, contatoId: string, nome: string, dataBase: Date): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');

    const atividades = cadencia.etapas.map((etapa: any) => {
      const data = new Date(dataBase);
      data.setDate(data.getDate() + etapa.dia);

      return {
        contatoId,
        contatoNome: nome,
        canal: etapa.canal,
        mensagem: etapa.mensagem,
        dataPrevista: data.toISOString(),
        status: 'pendente'
      };
    });

    for (const atividade of atividades) {
      await addDoc(atividadesRef, atividade);
    }

    console.log('✅ Atividades criadas no Firestore com base na cadência real!');
  }
}
