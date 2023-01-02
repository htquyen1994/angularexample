import {
    Component,
    Input,
    HostBinding,
    HostListener,
    Output,
    EventEmitter,
    ChangeDetectorRef,
    ElementRef
} from '@angular/core';
import { TOOLTIPPOSITION } from '@client/app/shared/global';

@Component({
    selector: 'go-button',
    moduleId: module.id,
    templateUrl: 'button.component.html',
    styleUrls: ['button.component.less']
})
export class ButtonComponent {
    @Input() icon: string;
    @Input() type: string;
    @Input() size: string;
    @HostBinding()
    @Input()
    tabindex = 0;
    @HostBinding('attr.role') role = 'button';
    @HostBinding('attr.aria-selected') buttonSelected: boolean;
    @HostBinding('attr.aria-disabled') buttonDisabled: boolean;
    @Input() tooltipPosition: string = TOOLTIPPOSITION.BELOW;
    _title: string;
    tooltipClass: string = 'tooltip-button';
    @Input()
    set selected(value: boolean) {
        this.buttonSelected = value;
        this.changeDetectorRef.markForCheck();
        this.detectChanges();
    }

    @Input()
    set disabled(value: boolean) {
        this.buttonDisabled = value;
        this.changeDetectorRef.markForCheck();
        this.detectChanges();
    }

    @Input()
    set title(value: string) {
        this._title = value ? value : '';
        this.elRef.nativeElement.setAttribute("title", "");
        this.detectChanges();
    }

    @Output() clicked = new EventEmitter<any>();

    _isLoading: boolean = false;
    @Input()
    set isLoading(value: boolean) {
        this._isLoading = value;
        this.changeDetectorRef.markForCheck();
        this.detectChanges();
    }

    isInit = false;
    constructor(private changeDetectorRef: ChangeDetectorRef, private elRef: ElementRef) {
    }

    ngOnInit() {
        this.tooltipClass = this.tooltipClass + ' ' + this.tooltipPosition;
        this.isInit = true;
        this.detectChanges();
    }

    @HostListener('click', ['$event'])
    onClick($event: MouseEvent) {
        $event.stopImmediatePropagation();

        if (!this.buttonDisabled) {
            this.clicked.emit($event);
        }
    }

    setSelected(state: boolean) {
        this.buttonSelected = state;
    }

    detectChanges() {
        if (!this.isInit) return;
        this.changeDetectorRef.detectChanges();
    }
}
