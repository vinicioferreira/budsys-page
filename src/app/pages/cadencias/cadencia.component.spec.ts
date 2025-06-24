import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadenciaComponent } from './cadencia.component';

describe('CadenciasComponent', () => {
  let component: CadenciaComponent;
  let fixture: ComponentFixture<CadenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CadenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
