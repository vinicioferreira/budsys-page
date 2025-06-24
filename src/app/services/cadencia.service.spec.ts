import { TestBed } from '@angular/core/testing';

import { CadenciaService } from './cadencia.service';

describe('CadenciasService', () => {
  let service: CadenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CadenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
