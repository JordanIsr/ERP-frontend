import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialAcademico } from './historial-academico';

describe('HistorialAcademico', () => {
  let component: HistorialAcademico;
  let fixture: ComponentFixture<HistorialAcademico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialAcademico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialAcademico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
