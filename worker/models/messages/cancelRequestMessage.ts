import { WWMessage } from './message';
import { PortPayload } from '../payloads/PortPayload';
import { WWMessageType } from './messageType';

export class CancelRequestsMessage extends WWMessage{
    constructor(portPayload:PortPayload){
        super();
        this.messageType = WWMessageType.CANCEL_REQUESTS;
        this.clientProcessId = -1;
        this.data = portPayload;
    }
}