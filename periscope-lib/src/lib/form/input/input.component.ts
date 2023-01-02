import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl } from '@angular/forms';
import { InputType } from './input.model';
import { toHex } from '../../commons/utils/helper';

@Component({
  selector: 'ps-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements OnInit, ControlValueAccessor {
  @Input() disabled: boolean = false;
  @Input() type: InputType
  private changed = new Array<(value: number | null) => void>();
  private touched = new Array<() => void>();
  public innerValue: any | null;

  constructor() { }

  ngOnInit() {
  }

  writeValue(value: any = null) {
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

  onChangeValue(value: any = null){
    if(this.type ==InputType.COLOR){
      value = toHex(value);
    }
    this.changed.forEach(f => f(value));
  }

}
