import { WWMessage } from './message';
import { WWMessageType } from './messageType';
import { InvalidCachePayload } from '../payloads/invalidCachePayload';

export class InvalidCacheMessage extends WWMessage {
    constructor(clientProcessId: number, payload: InvalidCachePayload) {
        super();
        this.messageType = WWMessageType.INVALIDATE_CACHE;
        this.clientProcessId = clientProcessId;
        this.data = payload;
    }
}