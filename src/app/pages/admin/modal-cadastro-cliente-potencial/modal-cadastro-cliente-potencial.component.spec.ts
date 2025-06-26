import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCadastroClientePotencialComponent } from './modal-cadastro-cliente-potencial.component';

describe('ModalCadastroClientePotencialComponent', () => {
  let component: ModalCadastroClientePotencialComponent;
  let fixture: ComponentFixture<ModalCadastroClientePotencialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalCadastroClientePotencialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCadastroClientePotencialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
