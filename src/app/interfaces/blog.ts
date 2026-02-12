import { Timestamp } from '@angular/fire/firestore';


export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id?: string;              // Firestore doc id (added by collectionData idField)
  title: string;
  slug: string;             // unique url: /blog/:slug
  excerpt: string;
  contentHtml: string;

  coverUrl?: string;

  status: BlogPostStatus;

  // Firestore timestamps
  publishedAt?: Timestamp;  // only when published
  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  // Optional SEO
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
}
