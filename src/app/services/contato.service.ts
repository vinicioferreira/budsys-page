import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, serverTimestamp } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContatoService {
  constructor(private firestore: Firestore) {}

  async salvarContato(dados: any): Promise<void> {
    const contatosRef = collection(this.firestore, 'contatos');
    const docRef = await addDoc(contatosRef, {
      ...dados,
      dataCadastro: serverTimestamp()
    });
    console.log('Contato salvo com ID:', docRef.id);
  }

  listarContatos(): Observable<any[]> {
    const contatosRef = collection(this.firestore, 'contatos');
    return from(
      getDocs(contatosRef).then(snapshot =>
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      )
    );
  }
}
