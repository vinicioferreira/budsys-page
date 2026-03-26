import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../../services/blog.service';
import { BlogPost } from '../../../interfaces/blog';

@Component({
  selector: 'app-blog-admin',
  templateUrl: './blog-admin.component.html',
  styleUrls: ['./blog-admin.component.scss']
})
export class BlogAdminComponent implements OnInit {
  loading = false;
  hoje = new Date();
  editingId: string | null = null;
  posts: BlogPost[] = [];

  post = {
    title: '',
    slug: '',
    excerpt: '',
    contentHtml: '',
    coverUrl: ''
  };

  constructor(private blog: BlogService) { }

  ngOnInit(): void {
    this.blog.getAllPosts().subscribe({
      next: (res) => {
        this.posts = res;
      },
      error: (err) => {
        console.error('Erro ao carregar posts:', err);
      }
    });
  }

  gerarSlug(): void {
    this.post.slug = (this.post.title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  editar(item: BlogPost): void {
    this.editingId = item.id || null;

    this.post = {
      title: item.title || '',
      slug: item.slug || '',
      excerpt: item.excerpt || '',
      contentHtml: item.contentHtml || '',
      coverUrl: item.coverUrl || ''
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async excluir(item: BlogPost): Promise<void> {
    if (!item.id) return;

    const confirmar = confirm(`Excluir o artigo "${item.title}"?`);
    if (!confirmar) return;

    try {
      await this.blog.deletePost(item.id);
      alert('Post excluído com sucesso!');

      if (this.editingId === item.id) {
        this.limparFormulario();
      }
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      alert('Erro ao excluir post.');
    }
  }

  async salvar(): Promise<void> {
    if (!this.post.title || !this.post.slug || !this.post.contentHtml) {
      alert('Preencha título, slug e conteúdo.');
      return;
    }

    try {
      this.loading = true;

      if (this.editingId) {
        await this.blog.updatePost(this.editingId, {
          ...this.post
        });

        alert('Post atualizado com sucesso!');
      } else {
        await this.blog.createPost({
          ...this.post,
          status: 'published',
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        alert('Post criado com sucesso!');
      }

      this.limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar post:', error);
      alert('Erro ao salvar post.');
    } finally {
      this.loading = false;
    }
  }

  limparFormulario(): void {
    this.editingId = null;
    this.post = {
      title: '',
      slug: '',
      excerpt: '',
      contentHtml: '',
      coverUrl: ''
    };
  }

  formatarData(data: any): Date | null {
    if (!data) return null;
    if (typeof data.toDate === 'function') return data.toDate();
    return data instanceof Date ? data : null;
  }
}