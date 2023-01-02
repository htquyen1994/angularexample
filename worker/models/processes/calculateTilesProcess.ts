import { ClientProcess } from './clientProcess';
import { ViewportTilesRequestPayload } from '../payloads/ViewportTilesRequestPayload';
import { WWMessage } from '../messages/message';
import { WorkerBase } from '../../workerBase';
import { Observable, Observer } from 'rxjs';
import { ResultResponse } from '../messages/resultResponse';
import { TileUtility } from './TileUtility';
import { CalculateTilesResponsePayload } from '../payloads/responses/calculateTilesResponePayload';

export class CalculateTilesProcess extends ClientProcess {

    private _config: ViewportTilesRequestPayload;

    start(): Observable<WWMessage> {
        return Observable.create((observer: Observer<WWMessage>) => {
            setTimeout(() => {
                const tileIds = TileUtility.GetTileIds([this._config.viewport], this._config.zoomLevel);
                const result = new ResultResponse(this.clientProcessId, new CalculateTilesResponsePayload(tileIds));
                observer.next(result);
                observer.complete();
            }, 0);
        })
    }

    constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
        super(parentWorker);
        this.messageProcessing = initialMessage;
        this.clientProcessId = initialMessage.clientProcessId;
        this._config = <ViewportTilesRequestPayload>initialMessage.data;
    }
}

