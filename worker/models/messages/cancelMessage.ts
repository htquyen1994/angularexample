import { WWMessage } from './message';
import { WWMessageType } from './messageType';

export class CancelMessage extends WWMessage {
    constructor(clientProcessId: number) {
        super();
        this.messageType = WWMessageType.CANCEL;
        this.clientProcessId = clientProcessId;
    }
}