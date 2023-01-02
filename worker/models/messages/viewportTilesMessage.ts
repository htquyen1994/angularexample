import { WWMessage } from './message';
import { ViewportTilesRequestPayload } from '../payloads/ViewportTilesRequestPayload';
import { WWMessageType } from './messageType';

export class ViewportTilesMessage extends WWMessage{
    constructor(clientProcessId: number,payload:ViewportTilesRequestPayload){
        super();
        this.messageType = WWMessageType.VIEWPORT_TILES;
        this.clientProcessId = clientProcessId;
        this.data = payload;
    }
}