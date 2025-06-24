import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { Cadencia } from '../interfaces/cadencia';

@Injectable({
  providedIn: 'root'
})
export class CadenciaService {
  constructor(private firestore: Firestore) {}

  salvarCadencia(cadencia: Cadencia): Promise<void> {
    const cadenciasRef = collection(this.firestore, 'cadencias');
    return addDoc(cadenciasRef, cadencia).then(() => {
      console.log('Cadência salva com sucesso');
    }).catch((error) => {
      console.error('Erro ao salvar cadência:', error);
      throw error;
    });
  }

  listarCadencias(): Observable<Cadencia[]> {
    const cadenciasRef = collection(this.firestore, 'cadencias');
    return from(
      getDocs(cadenciasRef).then(snapshot =>
        snapshot.docs.map(doc => doc.data() as Cadencia)
      )
    );
  }
}
