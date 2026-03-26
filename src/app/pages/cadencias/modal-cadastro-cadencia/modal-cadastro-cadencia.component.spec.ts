import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCadastroCadenciaComponent } from './modal-cadastro-cadencia.component';

describe('ModalCadastroCadenciaComponent', () => {
  let component: ModalCadastroCadenciaComponent;
  let fixture: ComponentFixture<ModalCadastroCadenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalCadastroCadenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCadastroCadenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
