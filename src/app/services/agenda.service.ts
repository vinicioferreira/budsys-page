import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  where,
  query,
  getDocs,
  deleteDoc
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
    if (!cadencia.etapas || !Array.isArray(cadencia.etapas) || cadencia.etapas.length === 0) {
      console.warn('❌ Esta cadência não tem etapas válidas. Nada será gerado.');
      return;
    }

    const atividadesRef = collection(this.firestore, 'atividades');

    for (const etapa of cadencia.etapas) {
      const data = new Date(dataBase);
      data.setDate(data.getDate() + (etapa.dia ?? 1));

      const acoes = Array.isArray(etapa.acoes)
        ? etapa.acoes.map((acao: any) => ({
          canal: acao?.canal || '',
          mensagem: acao?.mensagem || '',
          condicao: acao?.condicao || 'normal',
          horario: acao?.horario || ''
        }))
        : [];

      const primeiraAcao = acoes[0] || null;

      const atividade = {
        contatoId,
        contatoNome: nome,
        empresa: empresa || '',
        dataPrevista: data.toISOString(),
        status: 'novo',
        anotacao: '',
        acoes,
        canal: primeiraAcao?.canal || '', // compatibilidade temporária
        mensagem: primeiraAcao?.mensagem || '' // compatibilidade temporária
      };

      await addDoc(atividadesRef, atividade);
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
      status: 'novo',
      anotacao: ''
    };

    await addDoc(atividadesRef, atividade);
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

    const agora = new Date();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const dataPrevista = data['dataPrevista'] ? new Date(data['dataPrevista']) : null;

      if (dataPrevista && dataPrevista >= agora) {
        const atividadeRef = doc(this.firestore, 'atividades', docSnap.id);
        await updateDoc(atividadeRef, { status });
      }
    }
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

    const normalizarData = (d: Date) =>
      new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        0,
        0
      );

    let dataAntiga: Date | null = null;

    for (const docSnap of snapshot.docs) {
      if (docSnap.id === atividadeId) {
        const data = docSnap.data();
        if (data['dataPrevista']) {
          dataAntiga = normalizarData(new Date(data['dataPrevista']));
        }
        break;
      }
    }

    if (!dataAntiga) {
      throw new Error('Atividade atual não encontrada.');
    }

    const novaDataNormalizada = normalizarData(novaData);
    const diffMs = novaDataNormalizada.getTime() - dataAntiga.getTime();

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
      if (!data['dataPrevista']) continue;

      const dataPrevista = normalizarData(new Date(data['dataPrevista']));

      if (dataPrevista > dataAntiga) {
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

  async excluirAtividade(atividadeId: string): Promise<void> {
    const atividadeRef = doc(this.firestore, 'atividades', atividadeId);
    await deleteDoc(atividadeRef);
  }

  async excluirAtividadesFuturasPorContato(
    contatoId: string,
    atividadeAtualId?: string
  ): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const q = query(atividadesRef, where('contatoId', '==', contatoId));
    const snapshot = await getDocs(q);

    const normalizarData = (d: Date) =>
      new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        0,
        0
      );

    let dataAtual: Date | null = null;

    if (atividadeAtualId) {
      const atual = snapshot.docs.find(docSnap => docSnap.id === atividadeAtualId);

      if (atual) {
        const data = atual.data();
        if (data['dataPrevista']) {
          dataAtual = normalizarData(new Date(data['dataPrevista']));
        }
      }
    }

    if (!dataAtual) {
      throw new Error('Atividade atual não encontrada para definir corte das próximas.');
    }

    for (const docSnap of snapshot.docs) {
      if (atividadeAtualId && docSnap.id === atividadeAtualId) continue;

      const data = docSnap.data();
      if (!data['dataPrevista']) continue;

      const dataPrevista = normalizarData(new Date(data['dataPrevista']));

      if (dataPrevista > dataAtual) {
        const atividadeRef = doc(this.firestore, 'atividades', docSnap.id);
        await deleteDoc(atividadeRef);
      }
    }
  }

  async excluirTodasAtividadesPorContato(contatoId: string): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');
    const q = query(atividadesRef, where('contatoId', '==', contatoId));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const atividadeRef = doc(this.firestore, 'atividades', docSnap.id);
      await deleteDoc(atividadeRef);
    }
  }
}