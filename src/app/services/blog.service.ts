import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { BlogPost } from '../interfaces/blog';

@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private fs: Firestore) {}

  getPublishedPosts(): Observable<BlogPost[]> {
    const ref = collection(this.fs, 'posts');
    const q = query(
      ref,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(30)
    );
    return collectionData(q, { idField: 'id' }) as Observable<BlogPost[]>;
  }

  getPostBySlug(slug: string): Observable<BlogPost | null> {
    const ref = collection(this.fs, 'posts');
    const q = query(ref, where('slug', '==', slug), limit(1));
    return (collectionData(q, { idField: 'id' }) as Observable<BlogPost[]>).pipe(
      map(arr => arr?.[0] ?? null)
    );
  }
}
