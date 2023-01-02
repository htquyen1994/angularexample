import {ChangeDetectorRef, Component} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { ActionMessage, ActionMessageService, ActionMessageType } from '../../../core/services/action-message.service';

@Component({
    selector: 'go-message-area',
    templateUrl: 'message-area.component.html',
    styleUrls: ['message-area.component.less'],
    animations: [
        trigger('messageState', [
            state('open', style({
                    opacity: 1,
                    height: '*',
                    transform: 'translateX(0)'
                })
            ),
            transition(':enter', [
                style({
                    opacity: 0,
                    height: 0,
                    transform: 'translateX(-100%)'
                }),
                animate('500ms ease-in')

            ]),
            transition(':leave', [
                animate('500ms ease-out', style({
                    opacity: 0,
                    height: 0,
                    transform: 'translateX(100%)'
                }))
            ])
        ])
    ]
})
export class MessageAreaComponent {

    messages: ActionMessage[] = [];
    messageState: string[] = [];

    constructor(private changeDetectorRef: ChangeDetectorRef,
                private actionMessageService: ActionMessageService) {

        this.actionMessageService.message$.subscribe(message => {
            if (!this.messages.find(_ => _.message === message.message)) {
                this.onAdd(message);
            }
        });
    }

    onAdd(message: ActionMessage) {
        this.messages.push(message);
        this.messageState.push('open');
        this.changeDetectorRef.detectChanges();
        setTimeout(() => this.onRemove(message), 10000);
        // switch (message.type) {
        //     case ActionMessageType.INFO:
        //     case ActionMessageType.WARNING:
        //         setTimeout(() => this.onRemove(message), 10000);
        // }
    }

    onRemove(message: ActionMessage) {
        const index = this.getIndex(message);
        if (index !== -1) {
            this.messages.splice(index, 1);
            this.messageState.splice(index, 1);
            this.changeDetectorRef.detectChanges();
        }
    }

    getIndex(message: ActionMessage): number {
        return this.messages.findIndex(x => x === message);
    }
}
