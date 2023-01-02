import { ClientProcess } from './clientProcess';
import { WWMessage } from '../messages/message';
import { WorkerBase } from '../../workerBase';
import { Observable, Observer } from 'rxjs';
import { WorkQueue } from '../workQueue';
import { InvalidCachePayload } from '../payloads/invalidCachePayload';
import { InvalidCacheMessage } from '../messages/invalidCacheMessage';

export class InvalidCacheProcess extends ClientProcess {
    private payload: InvalidCachePayload;
    start(): Observable<WWMessage> {
        return Observable.create((observer: Observer<WWMessage>) => {
            const message = new InvalidCacheMessage(WorkQueue.getNextId(), this.payload);
            if (this._parentWorker instanceof WorkerBase) {
                this.postCacheMessage(message);
                observer.next(null)
                observer.complete();
            } else {
                observer.error("Not implement");
            }
        })
    }

    constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
        super(parentWorker);
        this.clientProcessId = initialMessage.clientProcessId;
        this.payload = <InvalidCachePayload>initialMessage.data;
    }
}