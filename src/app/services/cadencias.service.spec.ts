import { TestBed } from '@angular/core/testing';

import { CadenciasService } from './cadencias.service';

describe('CadenciasService', () => {
  let service: CadenciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CadenciasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
