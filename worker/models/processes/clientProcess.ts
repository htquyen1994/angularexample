import { WWMessage } from '../messages/message';
import { WorkerBase } from '../../workerBase';
import { Observable, of, Subscription, Subject } from 'rxjs';
import { CancelMessage } from '../messages/cancelMessage';
import { takeUntil } from 'rxjs/operators';
export abstract class ClientProcess {
    clientProcessId: number;
    workerId: number = null;
    messageProcessing: WWMessage;
    childClientProcessIds: number[] = [];
    currentClientProcessIds: number[] = [];
    isCanceled = false;
    private unsubscribe$ = new Subject<void>();
    public _parentWorker: WorkerBase;

    cancelProcess(): void {
        this.unsubscribe$.next();
        this.cleanup();
        this.isCanceled = true;
    }

    cleanup(): void {
        if ((this._parentWorker)) {
            this._parentWorker.cleanupProcess(this.clientProcessId);
            this._parentWorker = null;
        }
    }

    addChild(clientProcessId: number) {
        this.childClientProcessIds.push(clientProcessId);
    }

    removeChild(clientProcessId: number) {
        this.childClientProcessIds = this.childClientProcessIds.filter(e => e != clientProcessId);
    }

    addProcess(clientProcessId: number) {
      this.currentClientProcessIds.push(clientProcessId);
    }

    removeProcess(clientProcessId: number) {
      this.currentClientProcessIds = this.currentClientProcessIds.filter(e => e != clientProcessId);
    }

    reAssign(message){
      if ((this._parentWorker)) {
        return this._parentWorker.reassign(message).pipe(takeUntil(this.unsubscribe$));
      }
      return of(new CancelMessage(-1));
    }

    postMessage(workerId, message) {
        if ((this._parentWorker)) {
            return this._parentWorker.postMessage(workerId, message).pipe(takeUntil(this.unsubscribe$));
        }
        return of(new CancelMessage(-1));
    }

    postCacheMessage(message: WWMessage) {
        if ((this._parentWorker)) {
            return this._parentWorker.postCacheMessage(message).pipe(takeUntil(this.unsubscribe$));
        }
        return of(new CancelMessage(-1));
    }

    abstract start(anotherWorkerProcess?: boolean): Observable<WWMessage>;
    constructor(_parentWorker: WorkerBase) {
        this._parentWorker = _parentWorker;
    }
}
