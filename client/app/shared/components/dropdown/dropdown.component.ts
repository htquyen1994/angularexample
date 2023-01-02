import {
    Component,
    Input,
    Output,
    HostBinding,
    Inject,
    HostListener,
    ElementRef,
    EventEmitter,
    ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation
} from '@angular/core';

@Component({
    selector: 'go-dropdown',
    moduleId: module.id,
    templateUrl: 'dropdown.component.html',
    styleUrls: ['dropdown.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DropdownComponent {

    private onElement = false;
    @Input() autoClose = true;
    @Input() set isOpen(value: boolean) {
        if (value) {
            this.onState(value);
        }
        this.open = value;
    }

    @Output() close = new EventEmitter<boolean>();
    @Output() destroy = new EventEmitter<void>();

    @HostBinding('attr.tabindex') tabindex = 0;
    @HostBinding('attr.aria-expanded') open = false;

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        event.stopImmediatePropagation();
    }

    @HostListener('mouseenter')
    onMouseOver() {
        this.onElement = true;
    }

    @HostListener('mouseleave')
    onMouseOut() {
        this.onElement = false;
    }

    @HostListener('focusout', ['$event'])
    onFocusOut(event: any) {
        if (this.autoClose) {
            const contains = event.relatedTarget && this.elRef.nativeElement
                .compareDocumentPosition(event.relatedTarget) & Node.DOCUMENT_POSITION_CONTAINED_BY;
            if (!(event.relatedTarget && (contains || event.relatedTarget === this.elRef.nativeElement))) {
                if (this.onElement === false) {
                    this.onState(false);
                }
            }
        }
    }

    constructor(@Inject(ElementRef) private elRef: ElementRef, private cd: ChangeDetectorRef) {
    }

    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
    }

    onState(state: boolean) {
        this.open = state;

        if (state) {
            if(this.autoClose){
                setTimeout(() => {
                    this.elRef.nativeElement.focus();
                }, 300);
            }
        } else {
            this.close.emit(false);
        }

        this.cd.markForCheck();
        this.cd.detectChanges();
    }

    toggle() {
        this.open = !this.open;
        if (this.open) {
            this.onState(this.open);
        }

        this.cd.markForCheck();
        this.cd.detectChanges();
    }
}

