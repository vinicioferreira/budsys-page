import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, serverTimestamp, onSnapshot } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContatoService {
  constructor(private firestore: Firestore) {}

  /**
   * Salva o contato no Firestore
   */
  async salvarContato(dados: any, canalPadrao?: string): Promise<string> {
    const contatosRef = collection(this.firestore, 'contatos');

    const docRef = await addDoc(contatosRef, {
      ...dados,
      canal: canalPadrao || dados.canal || '',
      dataCadastro: serverTimestamp(),
    });

    console.log('Contato salvo com ID:', docRef.id);
    return docRef.id;  // 💥 ESSENCIAL: retorna o ID do documento
  }


  /**
   * Lista os contatos cadastrados
   */

  listarContatos(): Observable<any[]> {
    const contatosRef = collection(this.firestore, 'contatos');
    return new Observable(observer => {
      const unsubscribe = onSnapshot(contatosRef, snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        observer.next(data);
      }, error => observer.error(error));

      return { unsubscribe };
    });
  }
}
