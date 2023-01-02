import { Component, OnInit, Input, forwardRef, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

const SELECT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MultiSelectFilterComponent),
  multi: true
};

@Component({
  selector: 'ps-multi-select-filter',
  templateUrl: './multi-select-filter.component.html',
  styleUrls: ['./multi-select-filter.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ SELECT_VALUE_ACCESSOR ]
})
export class MultiSelectFilterComponent implements OnInit, ControlValueAccessor {
  @Input() disabled: boolean = false;
  @Input() placeholder: string;
  @Input() appendTo: any;
  @Input() styleClass: string;
  @Input('options') set _options(value: PsSelectOption[]){
    this.options = [...value];
    this.allItems = this.options.length ? this.options.map(e => e.items.map(_e=>({..._e, parentId: e.value}))).reduce((a, b) => [...a, ...b]) : [];
    this.cd.detectChanges();
  }
  private changed = new Array<(value: any) => void>();
  private touched = new Array<() => void>();
  public innerValue: any[] | null;
  public selectedGroup: any;
  public filter$ = new Subject<string>();
  public searchTerm: string = ''
  public options: PsSelectOption[] = [];
  public allItems: PsSelectOption[] = [];
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
    this.filter$.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe(term => {
          this.searchTerm = term;
          this.cd.detectChanges();
      });
  }

  selectedOptions(values: any[] = []) {
    const items = values.map(e => this.allItems.find(_e => _e.value === e)).filter(e => !!e);
    const groups: PsSelectOption[] = this.options.map(group=> {
      const _items = items.filter(e=>e.parentId === group.value);
      const { label, value } = group;
      return _items.length ? {
        label,
        value,
        items: _items
      } as PsSelectOption : null
    }).filter(e=>!!e);
    return groups;
  }

  getItemsInGroup([groupId, term]){
    if(!this.options || !this.options.length){
      return []
    }
    if(!groupId) {
      this.selectedGroup = this.options[0].value;
      return this.options[0].items
    }
    const items = this.options.length ? this.options.find(e=>e.value == groupId).items : [];
    if(term){
      const re = new RegExp(term, 'gi');
      return items.filter(e=>e.value.search(re) !== -1)
    }
    return items
  }

  isCheckedAll([values, allItems]){
    if(!(values && values.length)){
      return 0;
    }
    return values.length === allItems.length ? 2 : 1;
  }

  isCheckedAllGroup([values, selectedGroup]) {
    if (!(values && values.length)) {
      return 0;
    }
    const itemsInGroup = this.getItemsInGroup([selectedGroup, '']);
    const selectedItems = values.map(e => itemsInGroup.find(_e => _e.value === e)).filter(e => !!e);
    if (!selectedItems.length) {
      return 0;
    }
    return selectedItems.length === itemsInGroup.length ? 2 : 1;
  }

  isChecked([values, option]){
    return (values || []).includes(option.value) ? 2 : 0;
  }

  updateValue(value, item){
    if (!value) {
      const values = [...(this.innerValue || [])];
      const index = values.findIndex(e => e === item.value);
      if (index != -1) {
        values.splice(index, 1);
        this.writeValue(values)
        this.onChangeValue(this.innerValue);
      }
    } else {
      const values = [...(this.innerValue || [])];
      const index = values.findIndex(e => e === item.value);
      if (index == -1) {
        values.push(item.value);
        this.writeValue(values);
        this.onChangeValue(this.innerValue);
      }
    }
  }

  onCheckAll(value){
    if(value){
      const values = this.allItems.map(e=>e.value);
      this.writeValue(values);
      this.onChangeValue(this.innerValue);
      return;
    }
    this.writeValue([]);
    this.onChangeValue(this.innerValue);
  }

  onCheckAllGroup(checked, selectedGroup){
    const itemsInGroup = this.getItemsInGroup([selectedGroup, '']);
    const removedGroupItems: string[] = this.innerValue.map(e => itemsInGroup.find(_e => _e.value === e) ? null : e).filter(e => !!e);
    if(checked){
      removedGroupItems.push(...itemsInGroup.map(e=>e.value));
      this.writeValue(removedGroupItems);
      this.onChangeValue(this.innerValue);
      return;
    }
    this.writeValue(removedGroupItems);
    this.onChangeValue(this.innerValue);
  }


  removeSelection(selection) {
    this.updateValue(false, selection);
  }
}
