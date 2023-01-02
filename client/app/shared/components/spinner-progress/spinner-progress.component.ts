import { Component, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'go-spinner-progress',
    moduleId: module.id,
    templateUrl: 'spinner-progress.component.html',
    styleUrls: ['spinner-progress.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerProgressComponent {
    @Input("percentageValue") set _percentageValue(value: any) {
        if (value != this.percentageValue) {
            this.percentageValue = value;
            this.refresh();
        }
    };
    percentageValue: any;
    constructor(private changeDetector: ChangeDetectorRef) {
    }
    ngOnInit() {
    }

    refresh() {
        this.changeDetector.detectChanges();
    }

}
