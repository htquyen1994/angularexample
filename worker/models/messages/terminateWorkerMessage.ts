import { WWMessage } from './message';
import { WWMessageType } from './messageType';

export class TerminateWorkerMessage extends WWMessage {
    constructor(clientProcessId: number, data:any) {
        super();
        this.messageType = WWMessageType.TERMINATE_WORKER;
        this.clientProcessId = clientProcessId;
        this.data = data;
    }
}