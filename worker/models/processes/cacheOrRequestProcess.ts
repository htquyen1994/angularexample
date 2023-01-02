import { CacheOrRequestPayload } from '../payloads/CacheOrRequestPayload';
import { ClientProcess } from './clientProcess';
import { CacheOrRequestMessage } from '../messages/cacheOrRequestMessage';
import { WWMessage } from '../messages/message';
import { WorkerBase } from '../../workerBase';
import { Observable, Observer } from 'rxjs';
import { ResultResponse } from '../messages/resultResponse';
import { WorkQueue } from '../workQueue';
import { WWMessageType } from '../messages/messageType';
import { ErrorMessage } from '../messages/errorMessage';

export class CacheOrRequestProcess extends ClientProcess {
    private payload: CacheOrRequestPayload;
    start(): Observable<WWMessage> {
        return Observable.create((observer: Observer<WWMessage>) => {
            const message = new CacheOrRequestMessage(WorkQueue.getNextId(), this.payload);
            if (this._parentWorker instanceof WorkerBase) {
                this.postCacheMessage(message).subscribe((result: WWMessage) => {
                    // result.clientProcessId = this.clientProcessId; // <= not do this

                    if (result.messageType == WWMessageType.CANCEL) {
                        observer.complete();
                    } else if (result.messageType == WWMessageType.ERROR) {
                        const errorMesssage = new ErrorMessage(this.clientProcessId, result.data);
                        observer.next(errorMesssage);
                    } else {
                        const responseMesssage = new ResultResponse(this.clientProcessId, result.data);
                        observer.next(responseMesssage);
                    }
                });
            } else {
                observer.error("Not implement");
            }
        })
    }

    constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
        super(parentWorker);
        this.clientProcessId = initialMessage.clientProcessId;
        this.payload = <CacheOrRequestPayload>initialMessage.data;
    }
}
