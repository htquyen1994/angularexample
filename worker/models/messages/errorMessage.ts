import { WWMessage } from './message';
import { WWMessageType } from './messageType';

export class ErrorMessage extends WWMessage {
    constructor(clientProcessId: number, data?: any) {
        super();
        this.messageType = WWMessageType.ERROR;
        this.clientProcessId = clientProcessId;
        this.data = data;
    }
}