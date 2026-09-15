import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodosFlujo } from './periodos-flujo';

describe('PeriodosFlujo', () => {
  let component: PeriodosFlujo;
  let fixture: ComponentFixture<PeriodosFlujo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodosFlujo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodosFlujo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
