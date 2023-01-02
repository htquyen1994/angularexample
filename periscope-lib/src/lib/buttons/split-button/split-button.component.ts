import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { ISplitButtonItem, ISplitButtonEvent, ISplitButtonEventType } from './split-button';
import { MenuItem } from 'primeng/api/menuitem';

@Component({
  selector: 'ps-split-button',
  templateUrl: './split-button.component.html',
  styleUrls: ['./split-button.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SplitButtonComponent implements OnInit {
  @Input('item') item: ISplitButtonItem;
  @Input('items') set items(value: ISplitButtonItem[]) {
    if(!value || !value.length){
      return;
    }
    this.menuItems = value.map(e => ({ label: e.label, id: e.id, disabled: e.disabled ,command: () => { this.onClickItem(e) } }))
  }
  @Output() itemClick = new EventEmitter<ISplitButtonEvent>();

  public menuItems: MenuItem[]

  constructor() { }

  ngOnInit(): void {
  }

  onClickItem(item: ISplitButtonItem){
    const { id } = item;
    this.itemClick.emit({ id, type: ISplitButtonEventType.CLICK })
  }
}
