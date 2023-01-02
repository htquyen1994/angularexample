import { Component, OnInit, forwardRef, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IListItem } from '../models/order-list.model';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'go-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrderListComponent),
      multi: true
    }
  ]
})
export class OrderListComponent implements ControlValueAccessor, OnInit {

  @Input() disabled = false;
  @Input() list: IListItem[] = [];
  @Input()
  set searchString(value: string) {
    this.search = value;
    this.onSearch(this.search);
  }
  @Output() onChanged = new EventEmitter<IListItem>();
  @HostListener('click', ['$event'])
  onClick($event: MouseEvent) {
    $event.stopImmediatePropagation();
  }
  sortedList: IListItem[] = [];
  itemSelected: any;
  search = ''
  private filterSource$ = new Subject<string>();
  private filter = this.filterSource$.asObservable().pipe(debounceTime(200));
  constructor() {
    this.filter.subscribe((str: string) => {
      if (str) {
        this.sortedList = Object.assign([], this.list.filter(e => e.name.toUpperCase().includes(str.toUpperCase())));
      } else {
        this.sortedList = Object.assign([], this.list);
      }
    })
  }
  onChange = (value: IListItem) => { };

  onTouched = () => { };

  writeValue(value: IListItem): void {
    this.itemSelected = value;
    this.onChange(value);
    this.onChanged.emit(value);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnInit() {
    this.sortedList = this.list;
  }

  onSearch($event) {
    this.filterSource$.next($event)
  }

  onSelectItem(item: IListItem) {
    this.writeValue(item);
  }

}
