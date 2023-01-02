import { ClientProcess } from './clientProcess';
import { WWMessage } from '../messages/message';
import { WorkerBase } from '../../workerBase';
import { Observable, Observer } from 'rxjs';

import { DeleteOverlayMessage } from '../messages/deleteOverlayMessage';
import { WorkerMain } from '../../workerMain';
import { ResultResponse } from '../messages/resultResponse';

export class DeleteOverlayProcess extends ClientProcess {
    private layerId: string;
    start(): Observable<WWMessage> {
        return Observable.create((observer: Observer<WWMessage>) => {
            setTimeout(() => {
                if ((<WorkerMain>this._parentWorker).tileOverlays.has(this.layerId)) {
                    const tileOverlay = (<WorkerMain>this._parentWorker).tileOverlays.get(this.layerId);
                    tileOverlay.clear();
                    const result = new ResultResponse(this.clientProcessId, null);
                    observer.next(result);
                    observer.complete();
                }
            }, 0);
        })
    }

    constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
        super(parentWorker);
        this.messageProcessing = <DeleteOverlayMessage>initialMessage;
        this.clientProcessId = initialMessage.clientProcessId;
        this.layerId = (<DeleteOverlayMessage>this.messageProcessing).data['layerId'];
    }
}

