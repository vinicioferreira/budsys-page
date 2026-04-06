import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  where,
  query,
  getDocs
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  constructor(private firestore: Firestore) { }

  async gerarAtividadesDeCadencia(
    cadencia: any,
    contatoId: string,
    nome: string,
    empresa: string,
    dataBase: Date
  ): Promise<void> {
    console.log('⚡ gerarAtividadesDeCadencia chamado:', cadencia, contatoId, nome, empresa, dataBase);

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
        empresa: empresa || '',
        canal: etapa.canal || 'Sem canal',
        mensagem: etapa.mensagem || 'Sem mensagem',
        telefone: etapa.telefone || 'Sem telefone',
        dataPrevista: data.toISOString(),
        status: 'pendente',
        anotacao: ''
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
      empresa: '',
      canal: 'manual',
      mensagem: titulo,
      telefone: '',
      dataPrevista: data.toISOString(),
      status: 'pendente',
      anotacao: ''
    };

    await addDoc(atividadesRef, atividade);
  }

  async atualizarStatusAtividade(
    id: string,
    status: string,
    anotacao?: string,
    contatoId?: string
  ): Promise<void> {
    const atividadeRef = doc(this.firestore, 'atividades', id);

    const updateData: any = { status };

    if (anotacao?.trim()) {
      updateData.anotacao = anotacao.trim();
    }

    await updateDoc(atividadeRef, updateData);

    if (contatoId) {
      await this.atualizarStatusContato(contatoId, status);
    }
  }

  async reagendarAtividade(id: string, novaData: Date, anotacao?: string): Promise<void> {
    const atividadeRef = doc(this.firestore, 'atividades', id);

    const updateData: any = {
      dataPrevista: novaData.toISOString()
    };

    if (anotacao?.trim()) {
      updateData.anotacao = anotacao.trim();
    }

    await updateDoc(atividadeRef, updateData);
  }

  async reagendarAtividadeComDeslocamento(
    atividadeId: string,
    contatoId: string,
    novaData: Date,
    anotacao?: string
  ): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const q = query(atividadesRef, where('contatoId', '==', contatoId));
    const snapshot = await getDocs(q);

    let dataAntiga: Date | null = null;

    for (const docSnap of snapshot.docs) {
      if (docSnap.id === atividadeId) {
        const data = docSnap.data();
        dataAntiga = new Date(data['dataPrevista']);
        break;
      }
    }

    if (!dataAntiga) {
      throw new Error('Atividade atual não encontrada.');
    }

    const diffMs = novaData.getTime() - dataAntiga.getTime();

    const atividadeAtualRef = doc(this.firestore, 'atividades', atividadeId);

    const updateData: any = {
      dataPrevista: novaData.toISOString()
    };

    if (anotacao?.trim()) {
      updateData.anotacao = anotacao.trim();
    }

    await updateDoc(atividadeAtualRef, updateData);

    for (const docSnap of snapshot.docs) {
      if (docSnap.id === atividadeId) continue;

      const data = docSnap.data();
      const dataPrevista = data['dataPrevista'] ? new Date(data['dataPrevista']) : null;

      if (!dataPrevista) continue;
      if (data['status'] !== 'pendente') continue;

      if (dataPrevista.getTime() > dataAntiga.getTime()) {
        const novaDataFutura = new Date(dataPrevista.getTime() + diffMs);
        const atividadeRef = doc(this.firestore, 'atividades', docSnap.id);

        await updateDoc(atividadeRef, {
          dataPrevista: novaDataFutura.toISOString()
        });
      }
    }
  }

  async atualizarAnotacaoAtividade(id: string, texto: string): Promise<void> {
    const textoLimpo = (texto || '').trim();

    if (!textoLimpo) {
      throw new Error('Anotação vazia.');
    }

    const atividadeRef = doc(this.firestore, 'atividades', id);

    await updateDoc(atividadeRef, {
      anotacao: textoLimpo
    });
  }

  async atualizarMensagemAtividade(id: string, mensagem: string): Promise<void> {
    const mensagemLimpa = (mensagem || '').trim();

    if (!mensagemLimpa) {
      throw new Error('Mensagem vazia.');
    }

    const atividadeRef = doc(this.firestore, 'atividades', id);

    await updateDoc(atividadeRef, {
      mensagem: mensagemLimpa
    });
  }

  async atualizarStatusContato(contatoId: string, status: string): Promise<void> {
    const contatoRef = doc(this.firestore, 'contatos', contatoId);

    await updateDoc(contatoRef, {
      status
    });
  }

  async atualizarStatusAtividadesPorContato(contatoId: string, status: string): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const q = query(atividadesRef, where('contatoId', '==', contatoId));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const atividadeRef = doc(this.firestore, 'atividades', docSnap.id);
      await updateDoc(atividadeRef, { status });
    }
  }
}