import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentData,
  arrayUnion,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Cadencia, Etapa, AcaoEtapa } from '../interfaces/cadencia';

@Injectable({
  providedIn: 'root'
})
export class CadenciaService {

  constructor(private firestore: Firestore) {}

  private get cadenciasCollection(): CollectionReference<DocumentData> {
    return collection(this.firestore, 'cadencias');
  }

  private normalizarEtapa(etapa: any): Etapa {
    if (etapa?.acoes && Array.isArray(etapa.acoes)) {
      return {
        dia: Number(etapa.dia) || 1,
        acoes: etapa.acoes.map((acao: any) => ({
          canal: acao?.canal || '',
          mensagem: acao?.mensagem || '',
          condicao: acao?.condicao || 'normal'
        }))
      };
    }

    return {
      dia: Number(etapa?.dia) || 1,
      acoes: [
        {
          canal: etapa?.canal || '',
          mensagem: etapa?.mensagem || '',
          condicao: 'normal'
        }
      ]
    };
  }

  async criarCadencia(cadencia: Cadencia): Promise<string> {
    const docRef = await addDoc(this.cadenciasCollection, cadencia);
    console.log('✅ Cadência criada com ID:', docRef.id);
    return docRef.id;
  }

  listarCadencias(): Observable<(Cadencia & { id: string })[]> {
    return from(
      getDocs(this.cadenciasCollection).then(snapshot =>
        snapshot.docs.map(docSnap => {
          const data = docSnap.data() as any;

          return {
            ...data,
            id: docSnap.id,
            etapas: Array.isArray(data.etapas)
              ? data.etapas.map((etapa: any) => this.normalizarEtapa(etapa))
              : []
          };
        })
      )
    );
  }

  async adicionarEtapa(cadenciaId: string, etapa: Etapa): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', cadenciaId);
    await updateDoc(cadenciaDocRef, {
      etapas: arrayUnion(etapa)
    });
    console.log('✅ Etapa adicionada com sucesso');
  }

  async editarCadencia(id: string, dados: Partial<Cadencia>): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', id);
    await updateDoc(cadenciaDocRef, dados);
    console.log('✅ Cadência atualizada com sucesso');
  }

  async substituirCadencia(id: string, cadencia: Cadencia): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', id);
    await setDoc(cadenciaDocRef, cadencia);
    console.log('✅ Cadência substituída com sucesso');
  }

  async excluirCadencia(id: string): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', id);
    await deleteDoc(cadenciaDocRef);
    console.log('🗑️ Cadência excluída com sucesso');
  }

  async excluirEtapaPorIndex(cadenciaId: string, index: number): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', cadenciaId);
    const snap = await getDoc(cadenciaDocRef);

    if (!snap.exists()) {
      throw new Error('Cadência não encontrada');
    }

    const data = snap.data() as Cadencia;

    if (!Array.isArray(data.etapas)) {
      throw new Error('Cadência sem etapas válidas');
    }

    data.etapas.splice(index, 1);

    await updateDoc(cadenciaDocRef, {
      etapas: data.etapas
    });
  }

  async editarEtapa(cadenciaId: string, index: number, novaEtapa: Etapa): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', cadenciaId);
    const snap = await getDoc(cadenciaDocRef);

    if (!snap.exists()) {
      console.warn(`⚠ Cadência com ID ${cadenciaId} não existe.`);
      throw new Error('Cadência não encontrada');
    }

    const data = snap.data() as Cadencia;

    if (!data.etapas || !Array.isArray(data.etapas)) {
      console.warn(`⚠ Cadência com ID ${cadenciaId} está sem etapas válidas.`);
      throw new Error('Cadência inválida (sem etapas)');
    }

    data.etapas[index] = novaEtapa;

    await updateDoc(cadenciaDocRef, { etapas: data.etapas });
  }

  getCadenciaById(id: string) {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', id);
    return getDoc(cadenciaDocRef).then(snapshot => {
      if (!snapshot.exists()) {
        console.warn(`⚠ Cadência com ID ${id} não encontrada no Firestore.`);
        return null;
      }

      const data = snapshot.data() as any;

      return {
        ...data,
        id: snapshot.id,
        etapas: Array.isArray(data.etapas)
          ? data.etapas.map((etapa: any) => this.normalizarEtapa(etapa))
          : []
      };
    });
  }

  async getCadenciaByNome(nome: string): Promise<any> {
    const cadenciasRef = collection(this.firestore, 'cadencias');
    const snapshot = await getDocs(cadenciasRef);

    const cadencia = snapshot.docs
      .map(docItem => {
        const data = docItem.data() as any;
        return {
          id: docItem.id,
          ...data,
          etapas: Array.isArray(data.etapas)
            ? data.etapas.map((etapa: any) => this.normalizarEtapa(etapa))
            : []
        };
      })
      .find((c: any) => c.nome?.trim().toLowerCase() === nome.trim().toLowerCase());

    return cadencia || null;
  }
}