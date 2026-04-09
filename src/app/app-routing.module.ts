import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { CadenciaComponent } from './pages/cadencias/cadencia.component';
import { BlogPostComponent } from './pages/blog/blog-post/blog-post.component';
import { BlogListComponent } from './pages/blog/blog-list/blog-list.component';
import { BlogAdminComponent } from './pages/blog/blog-admin/blog-admin.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeadPerfilComponent } from './pages/admin/lead-perfil/lead-perfil.component';
import { ImportarLeadsComponent } from './pages/admin/importar-leads/importar-leads.component';

const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'admin/:id', component: LeadPerfilComponent, canActivate: [AuthGuard] },
  { path: 'admin-importar', component: ImportarLeadsComponent, canActivate: [AuthGuard] },
  { path: 'agenda', component: AgendaComponent, canActivate: [AuthGuard] },
  { path: 'cadencia', component: CadenciaComponent, canActivate: [AuthGuard] },
  { path: 'admin/blog', component: BlogAdminComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },

  { path: 'blog', component: BlogListComponent },
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
export class AppRoutingModule { }