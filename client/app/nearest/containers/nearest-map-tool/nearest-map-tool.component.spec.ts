import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NearestMapToolComponent } from './nearest-map-tool.component';

describe('NearestMapToolComponent', () => {
  let component: NearestMapToolComponent;
  let fixture: ComponentFixture<NearestMapToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NearestMapToolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NearestMapToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
