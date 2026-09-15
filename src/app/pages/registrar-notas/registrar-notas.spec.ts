import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistarNotas } from './registrar-notas';

describe('RegistrarNotas', () => {
  let component: RegistarNotas;
  let fixture: ComponentFixture<RegistarNotas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistarNotas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistarNotas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
