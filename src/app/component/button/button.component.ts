import { Component, Input, HostListener, OnInit } from '@angular/core';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  imports: [MatIcon]
})
export class ButtonComponent implements OnInit {
  @Input() textButton: string = '';
  @Input() icon?: string;
  @Input() size: 'auto' | '100' = 'auto';
  @Input() disabled: boolean = false;
  @Input() shortText: string = '';

  isMobile: boolean = false;

  ngOnInit() {
    this.checkScreen();
  }

  @HostListener('window:resize')
  checkScreen() {
    this.isMobile = window.innerWidth <= 768;
  }
}
