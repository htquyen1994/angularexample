import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, forwardRef, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { PsSelectOption } from './select.model'
import { DomHandler } from 'primeng/dom';

const SELECT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectComponent),
  multi: true
};
@Component({
  selector: 'ps-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ SELECT_VALUE_ACCESSOR ]
})
export class SelectComponent implements OnInit, ControlValueAccessor {
  @Input() disabled: boolean = false;
  @Input('options') options: PsSelectOption[] = []
  @Input() placeholder: string;
  @Input() showClear: boolean = false;
  @Input() appendTo: any;
  @Input() autoClose: boolean = true;
  @Input() styleClass: string;
  @Input() group: boolean = false;
  @Input() isFilter: boolean = false;
  private changed = new Array<(value: any) => void>();
  private touched = new Array<() => void>();
  public innerValue: any | null;
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
    this.cd.detectChanges();
  }
  onChangeValue(value: any = null) {
    this.changed.forEach(f => f(value));
  }

  ngOnInit(): void {
  }

}
