import { Component } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) { }

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

  logout() {
    // Caso queira implementar logout no futuro
    // Exemplo: limpar dados do sessionStorage/localStorage
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
