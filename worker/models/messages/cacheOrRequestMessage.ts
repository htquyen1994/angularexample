import { WWMessage } from './message';
import { CacheOrRequestPayload } from '../payloads/CacheOrRequestPayload';
import { WWMessageType } from './messageType';

export class CacheOrRequestMessage extends WWMessage {
    constructor(clientProcessId: number,payload : CacheOrRequestPayload) {
        super();
        this.messageType = WWMessageType.CACHE_OR_REQUEST;
        this.clientProcessId = clientProcessId;
        this.data = payload;
    }
}