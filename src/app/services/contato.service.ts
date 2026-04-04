import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
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

  async atualizarContato(contatoId: string, dados: any): Promise<void> {
    const contatoDocRef = doc(this.firestore, `contatos/${contatoId}`);

    await updateDoc(contatoDocRef, {
      nome: dados.nome || '',
      email: dados.email || '',
      telefone: dados.telefone || '',
      empresa: dados.empresa || '',
      mensagem: dados.mensagem || '',
      canal: dados.canal || ''
    });
  }

  async excluirContato(contatoId: string): Promise<void> {
    const contatoDocRef = doc(this.firestore, `contatos/${contatoId}`);
    await deleteDoc(contatoDocRef);
  }
}