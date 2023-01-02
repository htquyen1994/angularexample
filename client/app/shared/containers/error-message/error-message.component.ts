import {Component, Input} from '@angular/core';
import {IErrorResponse} from '../../index';

@Component({
    selector: 'go-error-message',
    moduleId: module.id,
    templateUrl: 'error-message.component.html',
    styleUrls: ['error-message.component.less']
})
export class ErrorMessageComponent {
    @Input() error: IErrorResponse;
}
