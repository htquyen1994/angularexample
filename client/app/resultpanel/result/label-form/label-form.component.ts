import { Component, Output, Input, EventEmitter, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';

import {
    MIN_RESULT_PANEL,
} from '../../../shared';
import { BreakpointService } from '../../../shared/services/breakpoint.service';
import { ILabelStyle } from 'src/client/app/shared/models/label.model';
import { BehaviorSubject } from 'rxjs';
import { OverlaypanelComponent } from '@client/app/shared/components';

@Component({
    selector: 'go-label-form',
    moduleId: module.id,
    templateUrl: 'label-form.component.html',
    styleUrls: ['label-form.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class LabelFormComponent {
    isLabelOpen = false;
    showIcon: boolean = true;
    style$ = new BehaviorSubject<ILabelStyle[]>([]);
    @Input() disabled: boolean;
    @Input()
    set styles(value: ILabelStyle[]) {
        this.style$.next(value ? value : []);
    };
    @Input() activeStyle: ILabelStyle;

    @ViewChild('dropdown', { static: true }) dropdown: OverlaypanelComponent;
    @Output() changeStyle = new EventEmitter<{ data: ILabelStyle }>();
    @Output() createStyle = new EventEmitter<ILabelStyle>();
    @Output() deleteStyle = new EventEmitter<ILabelStyle>();
    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private breakpointService: BreakpointService,
    ) {

        this.breakpointService.rightSection$.subscribe(value => {
            if (value.width < MIN_RESULT_PANEL) {
                this.showIcon = false;
            } else {
                this.showIcon = true;
            }
            this.changeDetectorRef.detectChanges();
        })
    }

    onStyleSelect(data: ILabelStyle = null) {
        this.changeStyle.next({ data });
    }

    onCreateForm(style: ILabelStyle = null) {
        this.createStyle.next(style);
    }

    onDelete(style: ILabelStyle) {
        this.deleteStyle.next(style);
    }

}
