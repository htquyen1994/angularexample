import { WWMessage } from './message';
import { ViewportTilesRequestPayload } from '../payloads/ViewportTilesRequestPayload';
import { WWMessageType } from './messageType';

export class CaculateTilesMessage extends WWMessage{
    constructor(clientProcessId: number,payload:ViewportTilesRequestPayload){
        super();
        this.messageType = WWMessageType.CALCULATE_TILES;
        this.clientProcessId = clientProcessId;
        this.data = payload;
    }
}