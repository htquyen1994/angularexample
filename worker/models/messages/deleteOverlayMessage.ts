import { WWMessage } from './message';
import { WWMessageType } from './messageType';
import { Payload } from '../payloads/Payload';

export class DeleteOverlayMessage extends WWMessage {
    constructor(clientProcessId: number, payload: Payload) {
        super();
        this.messageType = WWMessageType.DELETEOVERLAY;
        this.clientProcessId = clientProcessId;
        this.data = payload;
    }
}