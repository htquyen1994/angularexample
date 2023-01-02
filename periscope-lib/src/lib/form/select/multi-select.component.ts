import { Component, OnInit, forwardRef, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { PsSelectOption } from './select.model';

const SELECT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MultiSelectComponent),
  multi: true
};

@Component({
  selector: 'ps-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.less'],
  providers: [ SELECT_VALUE_ACCESSOR ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MultiSelectComponent implements OnInit, ControlValueAccessor {
  @Input() disabled: boolean = false;
  @Input('options') options: PsSelectOption[] = []
  @Input() placeholder: string;
  @Input() appendTo: any;
  @Input() styleClass: string;
  @Input() group: boolean = false;
  private changed = new Array<(value: any) => void>();
  private touched = new Array<() => void>();
  public innerValue: any[] | null;
  constructor(private cd: ChangeDetectorRef) { }

  writeValue(value: any = null) {
    this.innerValue = value;
    this.cd.detectChanges();
  }
  registerOnChange(fn: (value: any) => void) {
    this.changed.push(fn);
  }
  registerOnTouched(fn: () => void) {
    this.touched.push(fn);
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  onChangeValue(value: any = null) {
    this.changed.forEach(f => f(value));
  }

  ngOnInit(): void {
  }

}
