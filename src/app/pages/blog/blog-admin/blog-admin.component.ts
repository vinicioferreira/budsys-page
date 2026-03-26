import { Component } from '@angular/core';
import { BlogService } from '../../../services/blog.service';

@Component({
  selector: 'app-blog-admin',
  templateUrl: './blog-admin.component.html',
  styleUrls: ['./blog-admin.component.scss']
})
export class BlogAdminComponent {
  loading = false;
  hoje = new Date();

  post = {
    title: '',
    slug: '',
    excerpt: '',
    contentHtml: '',
    coverUrl: ''
  };

  constructor(private blog: BlogService) {}

  gerarSlug(): void {
    this.post.slug = (this.post.title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async salvar(): Promise<void> {
    if (!this.post.title || !this.post.slug || !this.post.contentHtml) {
      alert('Preencha título, slug e conteúdo.');
      return;
    }

    try {
      this.loading = true;

      await this.blog.createPost({
        ...this.post,
        status: 'published',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      alert('Post criado com sucesso!');

      this.post = {
        title: '',
        slug: '',
        excerpt: '',
        contentHtml: '',
        coverUrl: ''
      };
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert('Erro ao criar post.');
    } finally {
      this.loading = false;
    }
  }
}