import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionSolicitudes } from './revision-solicitudes';

describe('RevisionSolicitudes', () => {
  let component: RevisionSolicitudes;
  let fixture: ComponentFixture<RevisionSolicitudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisionSolicitudes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevisionSolicitudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
