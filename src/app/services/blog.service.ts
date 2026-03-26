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
}