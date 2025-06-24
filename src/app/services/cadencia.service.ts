import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, CollectionReference, DocumentData, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Cadencia, Etapa } from '../interfaces/cadencia';

@Injectable({
  providedIn: 'root'
})
export class CadenciaService {

  private get cadenciasCollection(): CollectionReference<DocumentData> {
    return collection(this.firestore, 'cadencias');
  }

  constructor(private firestore: Firestore) {}

  async criarCadencia(cadencia: Cadencia): Promise<string> {
    const docRef = await addDoc(this.cadenciasCollection, cadencia);
    console.log('Cadência criada com ID:', docRef.id);
    return docRef.id;
  }

  async adicionarEtapa(cadenciaId: string, etapa: Etapa): Promise<void> {
    const cadenciaDocRef = doc(this.firestore, 'cadencias', cadenciaId);
    await updateDoc(cadenciaDocRef, {
      etapas: arrayUnion(etapa)
    });
    console.log('Etapa adicionada com sucesso');
  }

  listarCadencias(): Observable<(Cadencia & { id: string })[]> {
    return from(
      getDocs(this.cadenciasCollection).then(snapshot =>
        snapshot.docs.map(docSnap => {
          const data = docSnap.data() as Cadencia;
          return {
            id: docSnap.id,
            ...data
          };
        })
      )
    );
  }

}
