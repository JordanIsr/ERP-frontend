import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarEstudiantes } from './buscar-estudiantes';

describe('BuscarEstudiantes', () => {
  let component: BuscarEstudiantes;
  let fixture: ComponentFixture<BuscarEstudiantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscarEstudiantes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuscarEstudiantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
