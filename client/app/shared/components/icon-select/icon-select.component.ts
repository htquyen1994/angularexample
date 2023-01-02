import { Component, Input, forwardRef, NgZone } from '@angular/core';
import { ICONS } from '@client/app/shared/models/overlayShapeIcon';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayPanel } from 'primeng/overlaypanel';

export const TEST_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => IconSelectComponent),
    multi: true
};

@Component({
    selector: 'go-icon-select',
    moduleId: module.id,
    templateUrl: 'icon-select.component.html',
    styleUrls: ['icon-select.component.less'],
    providers: [TEST_VALUE_ACCESSOR]
})
export class IconSelectComponent implements ControlValueAccessor {

    constructor(public ngZone: NgZone) {
    }

    @Input('value') _value: string;
    @Input('fillColor')
    set fillColor(value) {
        this._fillColor = value ? value : '#333333';
    }
    _fillColor: string = '#333333';
    // @HostBinding() tabindex: number = 0;
    // @Output() selected = new EventEmitter<any>();

    icons = ICONS;
    iconKeys = (<any>Object).values(ICONS);

    onChange: any = () => {
    }

    onTouched: any = () => {
    }

    get value() {
        return this._value;
    }

    set value(value) {
        if (value !== this._value) {
            this._value = value;
            this.onChange(value);
            this.onTouched();
        }

    }

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouched = fn;
    }
    onClick(event, op: OverlayPanel) {
        let _this = this;
        op.documentClickListener = null;
        op.show(event);
        op.documentClickListener = op.renderer.listen('document', 'mousedown', function (event) {
            if (!op.container.contains(event.target)) {
                _this.detroy(op);
            }
        });
    }

    detroy(op: OverlayPanel) {
        this.ngZone.run(() => {
            op.hide();
            op.ngOnDestroy();
        })
    }
}
