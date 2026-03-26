import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { CadenciaComponent } from './pages/cadencias/cadencia.component';
import { BlogPostComponent } from './pages/blog/blog-post/blog-post.component';
import { BlogListComponent } from './pages/blog/blog-list/blog-list.component';
import { BlogAdminComponent } from './pages/blog/blog-admin/blog-admin.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'agenda', component: AgendaComponent },
  { path: 'cadencia', component: CadenciaComponent },

  { path: 'blog', component: BlogListComponent },
  { path: 'blog-admin', component: BlogAdminComponent },
  { path: 'blog/:slug', component: BlogPostComponent },

  { path: '**', redirectTo: '' }
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  scrollOffset: [0, 80],
  onSameUrlNavigation: 'reload'
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule {}