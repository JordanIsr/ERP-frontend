import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudesMatriculas } from './solicitudes-matriculas';

describe('SolicitudesMatriculas', () => {
  let component: SolicitudesMatriculas;
  let fixture: ComponentFixture<SolicitudesMatriculas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudesMatriculas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudesMatriculas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
