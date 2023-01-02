import {
    Component, HostListener, Output, EventEmitter, Input, ChangeDetectionStrategy,
    HostBinding
} from '@angular/core';

@Component({
    selector: 'go-checkbox',
    moduleId: module.id,
    templateUrl: 'checkbox.component.html',
    styleUrls: ['checkbox.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent {
    @Output() change = new EventEmitter<number>();
    @Output() ngModelChange = new EventEmitter<number>();
    @HostBinding('attr.aria-disabled') valueDisabledAttr: boolean;

    value = 0;
    valueDisabled = false;

    @Input()
    set state(value: number) {
        this.value = value;
    }

    @Input()
    set disabled(value: boolean) {
        this.valueDisabled = value;
        this.valueDisabledAttr = value;
    }

    @HostListener('click', ['$event'])
    onclick(event: MouseEvent) {
        if (!this.valueDisabled) {
            this.changeState(this.value);
            this.change.emit(this.value);
            this.ngModelChange.emit(this.value);
            event.stopImmediatePropagation();
        }
    }

    changeState(state: number) {
        this.value = state === 2 ? 0 : 2;
    }
}
