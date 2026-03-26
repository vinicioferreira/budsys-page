import { Component, OnInit } from '@angular/core';
import { ModalContatoComponent } from './pages/modal-contato/modal-contato.component';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    private dialog: MatDialog,
    private overlay: Overlay
  ) { }
  ngOnInit(): void { }

  menuOpen = false;

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
