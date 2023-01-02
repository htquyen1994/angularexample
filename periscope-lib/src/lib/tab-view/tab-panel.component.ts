import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input, ElementRef, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'ps-tabpanel',
    templateUrl: './tab-panel.component.html',
    styleUrls: ['./tab-panel.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabPanelComponent {
    @Input() header: string;
    _disabled: boolean;
    @Input() get disabled(): boolean {
      return this._disabled;
    };
    set disabled(val: boolean) {
      this._disabled = !!val;
      this.cd.detectChanges();
    }
    _selected: boolean;
    @Input() get selected(): boolean {
        return this._selected;
    };
    set selected(val: boolean) {
        this._selected = !!val;
        this.cd.detectChanges();
    }
    constructor(public el: ElementRef, private cd: ChangeDetectorRef) { }
}
