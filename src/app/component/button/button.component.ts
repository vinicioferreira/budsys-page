import { Component, Input, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
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