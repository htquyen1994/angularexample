import { Component, OnInit, ChangeDetectionStrategy, Input, ViewEncapsulation, ChangeDetectorRef, Self, Optional, Output, EventEmitter, TemplateRef } from '@angular/core';
import { IDropdownItem } from './periscope-dropdown';
import { FormControl, NgControl } from '@angular/forms';
import * as _ from 'lodash';
import { MatOption } from '@angular/material/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface IDropdownItemGroup {
  name: string;
  options: IDropdownItem[];
  checked: number; // 0: false, 1: true, 2: indeterminate
}

@Component({
  selector: 'go-periscope-dropdown',
  templateUrl: './periscope-dropdown.component.html',
  styleUrls: ['./periscope-dropdown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PeriscopeDropdownComponent implements OnInit {
  @Input() multiple: boolean;
  @Input() placeholder: string;
  @Input() width: string;
  @Input() search: boolean = true;
  @Input() isGroup: boolean = false;
  @Input('options')
  set _options(value: IDropdownItem[]) {
    this.options$.next(value ? [...value] : []);
  }
  @Input('disabled')
  set _disabled(value: any) {
    this.setFormDisable(value);
  };
  @Input('isLoading')
  set _isLoading(value: boolean) {
    this.isLoading = value;
    this.setFormDisable(value); // disabled if loading
  }
  @Input() removeSelected = false;
  @Input() actionOptionIcon;
  @Output() actionOptionClicked = new EventEmitter<IDropdownItem>()
  // getCheckAll(seletedValue) {
  //   return seletedValue && seletedValue.length == ;
  // }
  getNameSelected([value, options]) {
    if (!value || !options.length) return null;
    let name = '';
    if (Array.isArray(value)) {
      if (!value[0]) return null;
      name = options.find(e => value.includes(e.id)).name;
    } else {
      const option = options.find(e => e.id == value);
      name = option ? option.name : '';
    }
    return name;
  }
  onChange = (value: any) => { };
  onTouched = () => { };
  oldoptions: IDropdownItem[] = [];
  options: IDropdownItem[] = [];
  groupOptions: IDropdownItemGroup[] = [];
  disabled: boolean = false;
  isLoading: boolean = false;
  selected: FormControl = new FormControl(null);
  options$ = new BehaviorSubject<IDropdownItem[]>([]);
  checkedAll = false;
  indeterminateAll = false;
  private unsubscribe$ = new Subject<void>();
  constructor(
    private cd: ChangeDetectorRef,
    @Optional() @Self() public ngControl: NgControl,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit() {
    const control = this.ngControl.control
    this.selected.setValidators(control.validator);
    this.setFormDisable(this.disabled);
    this.selected.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      this.onChange(value);
    })
    this.options$.asObservable().pipe(takeUntil(this.unsubscribe$),debounceTime(50)).subscribe(value => {
      const items = <IDropdownItem[]>_.orderBy(value ? [...value] : [], ['name'], ['asc']);
      this.oldoptions = [...items];
      this.setOptions(this.oldoptions);
      this.cd.detectChanges();
    })
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  writeValue(value: any): void {
    this.selected.setValue(value)
    // this.onChange(value);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.setFormDisable(isDisabled)
  }
  onModelChange($event) {
    this.writeValue(this.selected);
  }

  setFormDisable(value) {
    this.disabled = value;
    if (this.selected) {
      if (value) {
        this.selected.disable({ emitEvent: false });
      } else {
        this.selected.enable({ emitEvent: false });
      }
    }
    this.cd.detectChanges();
  }

  onKey(value) {
    if (value) {
      this.onSearch(value);
    } else {
      this.setOptions(this.oldoptions);
    }
  }

  onSearch(value) {
    let filter = value.toLowerCase();
    let dataArray = [];
    for (let i = 0; i < this.oldoptions.length; i++) {
      let option = this.oldoptions[i];
      if (option.name.toLowerCase().indexOf(filter) >= 0) {
        dataArray.push(option);
      }
    }
    this.setOptions(dataArray);
  }

  setOptions(value: IDropdownItem[] = []) {
    if (this.isGroup) {
      this.groupOptions = [];
      const itemsNotGrouping = [];
      for (let index = 0; index < value.length; index++) {
        const element = value[index];
        const groupName = element.groupName;
        if (!groupName) {
          itemsNotGrouping.push(element);
          continue;
        }
        const groupIndex = this.groupOptions.findIndex(e => e.name === groupName);
        if (groupIndex == -1) {
          this.groupOptions.push({ name: groupName, options: [element], checked: 0 });
        } else {
          this.groupOptions[groupIndex].options.push(element);
        }
      }
      this.groupOptions = _.orderBy(this.groupOptions, ['name'], ['asc']);
      const groupName = "No Group";
      this.groupOptions.push({ name: groupName, options: [...itemsNotGrouping], checked: 0 });
      this.cd.detectChanges();
    } else {
      this.options = [...value];
    }
    if(this.multiple){
      this.groupOptions.forEach(e => {
        this.updateGroupChecked(e.name);
      })
      this.updateCheckedAll();
    }
  }

  onClickGroup(group: IDropdownItemGroup, value) {
    const { name, options } = group;
    const selectedValue = Object.assign<string[], string[]>([], this.selected.value);
    const filtered = selectedValue.filter(e => !options.map(e => e.id).includes(e));
    if (value) {
      this.writeValue([...filtered, ...options.map(e => e.id)]);
    } else {
      this.writeValue([...filtered]);
    }
    this.updateGroupChecked(name);
    this.updateCheckedAll();
    this.cd.detectChanges();
  }

  onCheckAll(value) {
    // const currentValue = this.getCheckAll(this.selected.value);
    if (!value) {
      this.writeValue(null);
    } else {
      if(this.isGroup){
        this.writeValue(this.groupOptions.map(e => e.options).reduce((a, b) => [...a, ...b]).map(e=>e.id));
      }else{
        this.writeValue(this.options.map(e => e.id));
      }
    }
    if(this.isGroup){
      this.groupOptions.forEach(e => {
        this.updateGroupChecked(e.name);
      })
    }
    this.updateCheckedAll();
  }
  onRemoveSelected(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.writeValue(null);
  }
  onClickOptionAction(item) {
    event.stopPropagation();
    event.preventDefault();
    this.actionOptionClicked.next(item);
  }
  onClickOption(matOption: MatOption) {
    const { selected, value } = matOption;
    let selectedValue: string[] = this.selected.value ? Object.assign([], this.selected.value) : [];
    if (!selected) {
      this.writeValue(selectedValue.filter(e => e != value));
    } else {
      selectedValue.push(value);
      this.writeValue(selectedValue);
    }
    if(this.multiple){
      if(this.isGroup){
        const option = this.oldoptions.find(e=>e.id == value);
        if(option) this.updateGroupChecked(option.groupName);
      }
      this.updateCheckedAll();
    }
    this.cd.detectChanges();
  }

  updateCheckedAll() {
    const lengthSelected = Object.assign<string[], string[]>([], this.selected.value).length;
    const lengthOptions = this.oldoptions.length;
    this.checkedAll = lengthSelected == lengthOptions;
    this.indeterminateAll = lengthSelected != 0 && lengthOptions != lengthSelected
  }

  updateGroupChecked(groupName: string) {
    const index = this.groupOptions.findIndex(e => e.name == groupName);
    const selectedValue = Object.assign<string[], string[]>([], this.selected.value);
    if (index != -1) {
      const selected = this.groupOptions[index].options.filter(e => (<string[]>selectedValue).includes(e.id));
      this.groupOptions[index].checked = selected.length == this.groupOptions[index].options.length ? 1 : selected.length == 0 ? 0 : 2;
    }
  }
}
