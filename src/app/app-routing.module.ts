import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AgendaComponent } from './pages/agenda/agenda.component';

const routes: Routes = [
  { path: '', component: HomeComponent }, // Home default
  { path: 'admin', component: AdminComponent },
  { path: 'agenda', component: AgendaComponent }
/*  { path: 'contato', component: ContatoComponent },
  { path: 'crm', component: CrmComponent }, */
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
