import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { calcularFaseAtingida } from '../shared/status-comercial';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContatoService {
  constructor(private firestore: Firestore) { }

  async salvarContato(dados: any, canalPadrao?: string): Promise<string> {
    const contatosRef = collection(this.firestore, 'contatos');

    const docRef = await addDoc(contatosRef, {
      ...dados,
      canal: canalPadrao || dados.canal || '',
      dataCadastro: serverTimestamp(),
    });

    return docRef.id;
  }

  listarContatos(): Observable<any[]> {
    const contatosRef = collection(this.firestore, 'contatos');

    return new Observable(observer => {
      const unsubscribe = onSnapshot(
        contatosRef,
        snapshot => {
          const data = snapshot.docs.map(docItem => ({
            id: docItem.id,
            ...docItem.data()
          }));
          observer.next(data);
        },
        error => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  async atualizarContato(id: string, dados: any): Promise<void> {
    const ref = doc(this.firestore, 'contatos', id);
    return updateDoc(ref, dados);
  }

  async atualizarStatusComFase(id: string, novoStatus: string): Promise<void> {
    const ref  = doc(this.firestore, 'contatos', id);
    const snap = await getDoc(ref);
    const faseAtual = snap.data()?.['faseAtingida'] ?? null;

    const update: any = { status: novoStatus };

    const novaFase = calcularFaseAtingida(novoStatus, faseAtual);
    if (novaFase) update.faseAtingida = novaFase;

    return updateDoc(ref, update);
  }

  async buscarContatoPorId(id: string): Promise<any | null> {
    const ref = doc(this.firestore, 'contatos', id);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async excluirContato(contatoId: string): Promise<void> {
    const contatoDocRef = doc(this.firestore, `contatos/${contatoId}`);
    await deleteDoc(contatoDocRef);
  }
}