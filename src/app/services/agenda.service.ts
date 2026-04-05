import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  constructor(private firestore: Firestore) { }

  async gerarAtividadesDeCadencia(cadencia: any, contatoId: string, nome: string, dataBase: Date): Promise<void> {
    console.log('⚡ gerarAtividadesDeCadencia chamado:', cadencia, contatoId, nome, dataBase);

    if (!cadencia.etapas || !Array.isArray(cadencia.etapas) || cadencia.etapas.length === 0) {
      console.warn('❌ Esta cadência não tem etapas válidas. Nada será gerado.');
      return;
    }

    const atividadesRef = collection(this.firestore, 'atividades');

    for (const etapa of cadencia.etapas) {
      const data = new Date(dataBase);
      data.setDate(data.getDate() + (etapa.dia ?? 0));

      const atividade = {
        contatoId,
        contatoNome: nome,
        canal: etapa.canal || 'Sem canal',
        mensagem: etapa.mensagem || 'Sem mensagem',
        telefone: etapa.telefone || 'Sem telefone',
        dataPrevista: data.toISOString(),
        status: 'pendente'
      };

      console.log('🚀 Tentando salvar atividade:', atividade);

      try {
        const docRef = await addDoc(atividadesRef, atividade);
        console.log(`✅ Atividade salva no Firestore com ID: ${docRef.id}`, atividade);
      } catch (err) {
        console.error('❌ ERRO ao salvar atividade no Firestore:', err);
      }
    }
  }

  async criarAtividadeManual(titulo: string, data: Date): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');

    const atividade = {
      contatoId: null,
      contatoNome: titulo,
      canal: 'manual',
      mensagem: titulo,
      telefone: '',
      dataPrevista: data.toISOString(),
      status: 'pendente'
    };

    await addDoc(atividadesRef, atividade);
  }

  async atualizarStatusAtividade(id: string, status: string, anotacao?: string): Promise<void> {
    const atividadeRef = doc(this.firestore, 'atividades', id);

    const updateData: any = { status };
    if (anotacao) {
      updateData.anotacao = anotacao;
    }

    await updateDoc(atividadeRef, updateData);
  }

  async reagendarAtividade(id: string, novaData: Date, anotacao?: string): Promise<void> {
    const atividadeRef = doc(this.firestore, 'atividades', id);

    const updateData: any = {
      dataPrevista: novaData.toISOString()
    };

    if (anotacao) {
      updateData.anotacao = anotacao;
    }

    await updateDoc(atividadeRef, updateData);
  }
}