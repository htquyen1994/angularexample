import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NearestListComponent } from './nearest-list.component';

describe('NearestListComponent', () => {
  let component: NearestListComponent;
  let fixture: ComponentFixture<NearestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NearestListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NearestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
