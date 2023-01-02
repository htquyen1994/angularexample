import { Component, Input, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { cloneAbstractControl } from '../../../shared/global';

@Component({
    selector: 'go-style-form-item',
    moduleId: module.id,
    templateUrl: 'style-form-item.component.html',
    styleUrls: ['style-form-item.component.less']
})
export class StyleFormItemComponent {

    @Input('item')
    set _item(value: FormGroup) {
        this.unsubscribe$.next();
        this._index = this.index;
        this.item = cloneAbstractControl(value);
        if (this.item) {
            this.item.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
                this.updateValue(value);
            })
        }
    }
    @Input() index: any;
    @Input() isPointLayer = true;
    @Output() update = new EventEmitter<any>();
    _index: any;
    item: FormGroup;
    private unsubscribe$: Subject<void> = new Subject<void>();
    constructor() { }
    ngOnInit() {
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    updateValue(value: any) {
        this.update.next(value);
    }
}
