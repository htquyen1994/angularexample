import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, forwardRef, ChangeDetectorRef } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'go-slider-custom',
  templateUrl: './slider-custom.component.html',
  styleUrls: ['./slider-custom.component.less'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderCustomComponent),
      multi: true
    }
  ]
})
//https://rangle.io/blog/angular-2-ngmodel-and-custom-form-components/
export class SliderCustomComponent implements OnInit, ControlValueAccessor {
  @Input() min: number = 0;
  @Input() max: number = 1;
  @Input() step: number = 0.01;
  @Input() tickInterval: number = undefined;
  @Input("formatLabel") formatLabel: Function = (value: number) => {
    return `${value}`;
  };

  private innerValue: number | null;
  get value(): number | null {
    return this.innerValue;
  }
  set value(value: number | null) {
    if (this.innerValue !== value) {
      this.innerValue = value;
      this.changed.forEach(f => f(value));
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
    }
  }
  @Input() disabled: boolean = false;
  @Input() thumbLabel: boolean = true;
  private changed = new Array<(value: number | null) => void>();
  private touched = new Array<() => void>();
  // onModelChange: Function = () => {
  // }
  // onModelTouched: Function = () => {
  // }
  constructor(private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
  }
  touch() {
    this.touched.forEach(f => f());
  }
  writeValue(value: number | null) {
    this.innerValue = value;
  }
  registerOnChange(fn: (value: number | null) => void) {
    this.changed.push(fn);
  }
  registerOnTouched(fn: () => void) {
    this.touched.push(fn);
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
