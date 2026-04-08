import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  where,
  query,
  getDocs,
  deleteDoc,
  arrayUnion
} from '@angular/fire/firestore';
import { calcularFaseAtingida } from '../shared/status-comercial';

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

  async criarAtividadeManual(
    titulo: string,
    data: Date,
    contato?: { id: string; nome: string; empresa: string }
  ): Promise<void> {
    const atividadesRef = collection(this.firestore, 'atividades');

    const atividade = {
      contatoId:   contato?.id   ?? null,
      contatoNome: contato?.nome ?? titulo,
      empresa:     contato?.empresa ?? '',
      canal: 'manual',
      mensagem: titulo,
      dataPrevista: data.toISOString(),
      status: 'novo',
      anotacao: '',
      acoes: [{ canal: 'manual', mensagem: titulo, condicao: 'normal', horario: '' }]
    };

    await addDoc(atividadesRef, atividade);
  }

  async atualizarStatusContato(contatoId: string, status: string): Promise<void> {
    const contatoRef = doc(this.firestore, 'contatos', contatoId);
    const snap = await getDoc(contatoRef);
    const faseAtual = snap.data()?.['faseAtingida'] ?? null;

    const update: any = { status };
    const novaFase = calcularFaseAtingida(status, faseAtual);
    if (novaFase) update.faseAtingida = novaFase;

    await updateDoc(contatoRef, update);
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

  async buscarProximasAtividadesPorContato(): Promise<Map<string, { dataPrevista: Date; canal: string; atrasada: boolean }>> {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'atividades'));
      const agora = new Date();

      const porContato = new Map<string, { dataPrevista: Date; canal: string }[]>();

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const contatoId = data['contatoId'];
        if (!contatoId || !data['dataPrevista']) continue;

        const dataPrevista = new Date(data['dataPrevista']);
        if (isNaN(dataPrevista.getTime())) continue;

        const canal = data['acoes']?.[0]?.canal || data['canal'] || '';

        if (!porContato.has(contatoId)) porContato.set(contatoId, []);
        porContato.get(contatoId)!.push({ dataPrevista, canal });
      }

      const resultado = new Map<string, { dataPrevista: Date; canal: string; atrasada: boolean }>();

      for (const [contatoId, atividades] of porContato) {
        atividades.sort((a, b) => a.dataPrevista.getTime() - b.dataPrevista.getTime());

        const proxima = atividades.find(a => a.dataPrevista >= agora);
        if (proxima) {
          resultado.set(contatoId, { ...proxima, atrasada: false });
        } else {
          const ultima = atividades[atividades.length - 1];
          resultado.set(contatoId, { ...ultima, atrasada: true });
        }
      }

      return resultado;
    } catch (error) {
      console.error('Erro ao buscar próximas atividades:', error);
      return new Map();
    }
  }

  async adicionarAnotacao(id: string, texto: string): Promise<{ texto: string; criadoEm: string }> {
    const nota = { texto: texto.trim(), criadoEm: new Date().toISOString() };
    const atividadeRef = doc(this.firestore, 'atividades', id);
    await updateDoc(atividadeRef, { anotacaoLog: arrayUnion(nota) });
    return nota;
  }

  async atualizarAcoesAtividade(id: string, acoes: any[]): Promise<void> {
    const atividadeRef = doc(this.firestore, 'atividades', id);
    await updateDoc(atividadeRef, { acoes });
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