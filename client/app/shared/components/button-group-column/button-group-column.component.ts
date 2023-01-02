import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation, Input, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { ButtonGroupColumnItem } from './button-group-column'

@Component({
  selector: 'ps-button-group-column',
  templateUrl: './button-group-column.component.html',
  styleUrls: ['./button-group-column.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ButtonGroupColumnComponent implements OnInit {
  @Input('items') items: ButtonGroupColumnItem[];
  @Input("active") set _active(value){
    this.active = value;
    this.defaultItem = this.items.find(e=>e.id == this.active) || this.defaultItem;
    this.cd.detectChanges();
  }
  @Input("disabled") set _disabled(value) {
    this.disabled = value;
    this.collapse();
    this.cd.detectChanges();
  }
  @Input() isExpanded = false;
  @Output() toggled = new EventEmitter<boolean>();
  @Output() clicked = new EventEmitter<any>();
  disabled = false;
  defaultItem: ButtonGroupColumnItem = null;
  active: string;
  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.defaultItem = this.items[0];
    if(this.active){
      this.defaultItem = this.items.find(e=>e.id == this.active) || this.defaultItem;
    }
  }

  onToggleDrawingTool() {
    this.isExpanded = !this.isExpanded;
    this.toggled.next(this.isExpanded);
    this.cd.detectChanges();
  }

  collapse() {
    this.isExpanded = false;
    this.toggled.next(this.isExpanded);
    this.cd.detectChanges();
  }

  expand() {
    this.isExpanded = true;
    this.toggled.next(this.isExpanded);
    this.cd.detectChanges();
  }

  onClickButton(item: ButtonGroupColumnItem) {
    // this.defaultItem = item;
    this.clicked.next(item.id);
    this.cd.detectChanges();
  }
}
