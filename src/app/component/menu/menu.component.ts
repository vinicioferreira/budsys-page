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

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Se quiser carregar nome da empresa/usuário de localStorage ou outra fonte, implemente aqui
  }

  toggleMenu() {
    this.menuVisible = !this.menuVisible;

    const toggleButton = document.querySelector('.menu-toggle');
    if (this.menuVisible) {
      toggleButton?.classList.add('menu-open');
    } else {
      toggleButton?.classList.remove('menu-open');
    }
  }

  toggleCargos() {
    this.isCargosExpanded = !this.isCargosExpanded;
  }

  toggleOrcamentos() {
    this.isOrcamentosExpanded = !this.isOrcamentosExpanded;
  }

  selectMenu() {
    this.menuVisible = false;
  }

  logout() {
    // Caso queira implementar logout no futuro
    // Exemplo: limpar dados do sessionStorage/localStorage
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
