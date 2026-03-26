import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, CollectionReference, DocumentData, arrayUnion, setDoc, arrayRemove, getDoc} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Cadencia, Etapa } from '../interfaces/cadencia';

@Injectable({
  providedIn: 'root'
})
export class CadenciaService {

  constructor(private firestore: Firestore) {}

  private get cadenciasCollection(): CollectionReference<DocumentData> {
    return collection(this.firestore, 'cadencias');
  }

  /**
   * Cria uma nova cadência e retorna o ID gerado
   */
  async criarCadencia(cadencia: Cadencia): Promise<string> {
    const docRef = await addDoc(this.cadenciasCollection, cadencia);
    console.log('✅ Cadência criada com ID:', docRef.id);
    return docRef.id;
  }

  /**
   * Lista todas as cadências com ID
   */
  listarCadencias(): Observable<(Cadencia & { id: string })[]> {
    return from(
      getDocs(this.cadenciasCollection).then(snapshot =>
        snapshot.docs.map(docSnap => {
          const data = docSnap.data() as Cadencia;
          return { ...data, id: docSnap.id };
        })
      )
    );
  }

  /**
   * Adiciona uma nova etapa a uma cadência específica
   */
  async adicionarEtapa(cadenciaId: string, etapa: Etapa): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', cadenciaId);
    await updateDoc(cadenciaDocRef, {
      etapas: arrayUnion(etapa)
    });
    console.log('✅ Etapa adicionada com sucesso');
  }

  /**
   * Atualiza os dados da cadência inteira (nome, descrição, etapas etc)
   */
  async editarCadencia(id: string, dados: Partial<Cadencia>): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', id);
    await updateDoc(cadenciaDocRef, dados);
    console.log('✅ Cadência atualizada com sucesso');
  }

  /**
   * Substitui completamente o documento da cadência
   */
  async substituirCadencia(id: string, cadencia: Cadencia): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', id);
    await setDoc(cadenciaDocRef, cadencia);
    console.log('✅ Cadência substituída com sucesso');
  }

  /**
   * Exclui uma cadência
   */
  async excluirCadencia(id: string): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', id);
    await deleteDoc(cadenciaDocRef);
    console.log('🗑️ Cadência excluída com sucesso');
  }

  async excluirEtapa(cadenciaId: string, etapa: Etapa): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', cadenciaId);
    await updateDoc(cadenciaDocRef, {
      etapas: arrayRemove(etapa)
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

      const data = snapshot.data() as Cadencia;
      console.log('📌 Cadência carregada do Firestore:', data);
      return data;
    });
  }
}
