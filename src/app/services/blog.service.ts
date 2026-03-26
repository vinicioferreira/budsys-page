import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';
import { BlogPost } from '../interfaces/blog';

@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private afs: AngularFirestore) { }

  getPublishedPosts(): Observable<BlogPost[]> {
    return this.afs
      .collection<BlogPost>('posts', ref =>
        ref.where('status', '==', 'published').limit(30)
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as BlogPost;
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
  }

  getAllPosts(): Observable<BlogPost[]> {
    return this.afs
      .collection<BlogPost>('posts', ref => ref.orderBy('createdAt', 'desc'))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as BlogPost;
            const id = a.payload.doc.id;
            return {
              id,
              ...data,
              publishedAt: (data as any).publishedAt?.toDate ? (data as any).publishedAt.toDate() : null,
              createdAt: (data as any).createdAt?.toDate ? (data as any).createdAt.toDate() : null,
              updatedAt: (data as any).updatedAt?.toDate ? (data as any).updatedAt.toDate() : null
            };
          })
        )
      );
  }

  getPostBySlug(slug: string): Observable<BlogPost | null> {
    return this.afs
      .collection<BlogPost>('posts', ref =>
        ref.where('slug', '==', slug).where('status', '==', 'published').limit(1)
      )
      .snapshotChanges()
      .pipe(
        map(actions => {
          if (!actions.length) return null;
          const doc = actions[0].payload.doc;
          return { id: doc.id, ...(doc.data() as BlogPost) };
        })
      );
  }

  async createPost(post: any) {
    return this.afs.collection('posts').add(post);
  }

  async updatePost(id: string, post: any) {
    return this.afs.collection('posts').doc(id).update({
      ...post,
      updatedAt: new Date()
    });
  }

  async deletePost(id: string) {
    return this.afs.collection('posts').doc(id).delete();
  }
}