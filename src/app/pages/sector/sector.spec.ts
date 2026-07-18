import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sector } from './sector';

describe('Sector', () => {
  let component: Sector;
  let fixture: ComponentFixture<Sector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sector],
    }).compileComponents();

    fixture = TestBed.createComponent(Sector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
