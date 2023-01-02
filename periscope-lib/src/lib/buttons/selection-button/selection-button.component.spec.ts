import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionButtonComponent } from './selection-button.component';

describe('SelectionButtonComponent', () => {
  let component: SelectionButtonComponent;
  let fixture: ComponentFixture<SelectionButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectionButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
