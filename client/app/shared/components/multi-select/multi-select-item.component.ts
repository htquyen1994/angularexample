import {Component, Input, EventEmitter, Output} from '@angular/core';

@Component({
    selector: 'go-multi-select-item',
    moduleId: module.id,
    templateUrl: 'multi-select-item.component.html',
    styleUrls: ['multi-select-item.component.less']
})
export class MultiSelectItemComponent {

    @Input() checked = false;
    @Input() item: any;
    @Output() update = new EventEmitter<{ id: string, value: boolean }>();

    updateValue(value) {
        this.update.next({
            id: this.item.value,
            value: value
        });
    }
}
