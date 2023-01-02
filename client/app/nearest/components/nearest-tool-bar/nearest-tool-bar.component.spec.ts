import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NearestToolBarComponent } from './nearest-tool-bar.component';

describe('NearestToolBarComponent', () => {
  let component: NearestToolBarComponent;
  let fixture: ComponentFixture<NearestToolBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NearestToolBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NearestToolBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
