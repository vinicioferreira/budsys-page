import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BlogService } from '../../../services/blog.service';
import { BlogPost } from '../../../interfaces/blog';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss']
})
export class BlogListComponent {
  posts$: Observable<BlogPost[]>;

  constructor(private blogService: BlogService) {
    this.posts$ = this.blogService.getPublishedPosts();
  }
}