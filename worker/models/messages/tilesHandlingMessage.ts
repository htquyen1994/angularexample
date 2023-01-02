import { WWMessage } from './message';
import { WWMessageType } from './messageType';
import { TilesHandlingPayload } from '../payloads/tilesHandlingPayload';

export class TilesHandlingMessage extends WWMessage {
    constructor(clientProcessId: number, payload: TilesHandlingPayload) {
        super();
        this.messageType = WWMessageType.HANDLING_TILES;
        this.clientProcessId = clientProcessId;
        this.data = payload;
    }
}