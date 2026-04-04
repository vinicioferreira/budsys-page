import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { BlogService } from '../../../services/blog.service';
import { BlogPost } from '../../../interfaces/blog';

declare var gtag: Function;

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss']
})
export class BlogPostComponent {
  post$: Observable<BlogPost | null>;

  constructor(private route: ActivatedRoute, private blog: BlogService) {
    this.post$ = this.route.paramMap.pipe(
      switchMap(params => this.blog.getPostBySlug(params.get('slug') || ''))
    );
  }

  trackWhats(slug: string, event: Event) {
    event.preventDefault();

    console.log('teste track whats');

    gtag('event', 'click_whatsapp', {
      event_category: 'engajamento',
      event_label: slug
    });

    gtag('event', 'generate_lead', {
      event_label: slug
    });

    window.open(
      'https://wa.me/5535991569148?text=Oi%21%20Li%20um%20artigo...',
      '_blank'
    );
  }
}