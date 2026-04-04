import { Component, OnInit } from '@angular/core';
import { ModalContatoComponent } from './pages/modal-contato/modal-contato.component';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

declare var gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  menuOpen = false;

  constructor(
    private dialog: MatDialog,
    private overlay: Overlay,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        gtag('config', 'G-MD04DZP1G5', {
          page_path: event.urlAfterRedirects,
          page_title: document.title,
          page_location: window.location.href
        });
      });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  abrirModal() {
    this.dialog.open(ModalContatoComponent, {
      width: '400px',
      disableClose: false,
      hasBackdrop: true,
      autoFocus: false,
      restoreFocus: true,
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });
  }
}