import {Component, ChangeDetectionStrategy, Input} from '@angular/core';

export enum SpinnerType{
  CIRCLE = 'CIRCLE',
  ELLIPSIS = 'ELLIPSIS'
}

@Component({
    selector: 'go-spinner',
    moduleId: module.id,
    templateUrl: 'spinner.component.html',
    styleUrls: ['spinner.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
    @Input() diameter = 50;
    @Input() type = SpinnerType.CIRCLE;
    @Input() withoutWrapper = false;
    SpinnerType = SpinnerType;
}
