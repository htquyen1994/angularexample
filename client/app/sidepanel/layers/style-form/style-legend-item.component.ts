import { Component, Input, EventEmitter, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'go-style-legend-item',
  moduleId: module.id,
  templateUrl: 'style-legend-item.component.html',
  styleUrls: ['style-legend-item.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class StyleLegendItemComponent {

  @Input() item: any;
  @Input() isIcon = true;
  @Input() isShowStroke: boolean = false;
  @Input() isShowHiddenIcon = false;
  @Output() update = new EventEmitter<{ id: string, value: boolean }>();
  @Output() toggle = new EventEmitter<boolean>();

  updateValue(value) {
    this.update.next({
      id: this.item.value,
      value: value
    });
  }
  onToggle() {
    if (this.isShowHiddenIcon) {
      const { hidden } = this.item;
      this.toggle.next(!hidden);
    }
  }
}
