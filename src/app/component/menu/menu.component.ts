import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  isOrcamentosExpanded = false;
  isCargosExpanded = false;
  menuVisible = false;
  nomeEmpresa: string = '';
  nomeUsuario: string = '';
  espacoUsado = 0;

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
  ) { }

  ngOnInit(): void {
    // Se quiser carregar nome da empresa/usuário de localStorage ou outra fonte, implemente aqui
  }

  toggleMenu(): void {
    this.menuVisible = !this.menuVisible;
  }

  selectMenu(): void {
    if (window.innerWidth <= 1024) {
      this.menuVisible = false;
    }
  }

  toggleCargos() {
    this.isCargosExpanded = !this.isCargosExpanded;
  }

  toggleOrcamentos() {
    this.isOrcamentosExpanded = !this.isOrcamentosExpanded;
  }

  async logout() {
    await this.afAuth.signOut(); // 🔥 isso é o principal
    this.router.navigate(['/login']);
  }
}
