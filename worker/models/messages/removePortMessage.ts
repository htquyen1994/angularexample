import { WWMessage } from './message';
import { PortPayload } from '../payloads/PortPayload';
import { WWMessageType } from './messageType';

export class RemovePortMessage extends WWMessage{
    constructor(portPayload:PortPayload){
        super();
        this.messageType = WWMessageType.REMOVE_PORTS;
        this.clientProcessId = -1;
        this.data = portPayload;
    }
}