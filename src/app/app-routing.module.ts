import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { CadenciaComponent } from './pages/cadencias/cadencia.component';
import { ExtraOptions } from '@angular/router';
import { BlogPostComponent } from './pages/blog/blog-post/blog-post.component';
import { BlogListComponent } from './pages/blog/blog-list/blog-list.component';

const routes: Routes = [
  { path: '', component: HomeComponent }, // Home default
  { path: 'admin', component: AdminComponent },
  { path: 'agenda', component: AgendaComponent },
  { path: 'cadencia', component: CadenciaComponent },

  { path: '', component: HomeComponent },        // Home
  { path: 'blog', component: BlogListComponent },// Blog list
  { path: 'blog/:slug', component: BlogPostComponent }, // Blog post (NEW)

  { path: '**', redirectTo: '' }
/*  { path: 'contato', component: ContatoComponent },
  { path: 'crm', component: CrmComponent }, */
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',   // ativa rolagem automática até o id
  scrollPositionRestoration: 'enabled', // volta pro topo ao navegar
  scrollOffset: [0, 80] // opcional, compensa altura do header fixo
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
