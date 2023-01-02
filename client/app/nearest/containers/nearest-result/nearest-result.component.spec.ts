import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NearestResultComponent } from './nearest-result.component';

describe('NearestResultComponent', () => {
  let component: NearestResultComponent;
  let fixture: ComponentFixture<NearestResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NearestResultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NearestResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
