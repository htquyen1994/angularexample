import { environment } from '../client/environments/environment';
import { WWMessage } from './models/messages/message';
import { Subject, Observable, of, forkJoin } from 'rxjs';
import { filter, map, first } from 'rxjs/operators';
import { PortConfigurationMessage } from './models/messages/portConfigurationMessage';
import { PortPayload } from './models/payloads/PortPayload';
import { API_BASE_HREF, NAME_OF_WORKER_HANDLING_CHILD, TERMINATE_WORKER_TIMEOUT, TERMINATE_WORKER_TIMEOUT_CHILD, NAME_OF_WORKER_HANDLING } from '../client/app/shared/global_origin';
import { CancelMessage } from './models/messages/cancelMessage';
import { TerminateWorkerMessage } from './models/messages/terminateWorkerMessage';
import { WorkQueue } from './models/workQueue';
import { ConfigWorkerMessage } from './models/messages/configWorkerMessage';
import { ConfigWorkerPayload } from './models/payloads/configWorkerPayload';
export abstract class CustomWorker {
    _workerId: string;
    static workerNumber = 0;
    numberWorkerCreated = 0;
    public readonly workerPath = `${environment.baseUrl}assets/workers/`;
    private _workers: { [key: number]: Worker } = {};
    workerListeners: { [key: number]: Subject<WWMessage> } = {};
    private idle: number[] = [];
    private timeoutIdle: { [workerId: number]: any } = {};
    public max_number_workers = 0;
    public max_number_workers_handling: number = 0;
    private TERMINATE_WORKER_TIMEOUT = TERMINATE_WORKER_TIMEOUT_CHILD;
    constructor() {
    }

    public configWorker(max_number_workers, max_number_workers_handling){
      this.idle = [];
      if(!this._workerId){
        this.TERMINATE_WORKER_TIMEOUT = TERMINATE_WORKER_TIMEOUT;
      }
      for (let index = max_number_workers; index > 0; index--) {
        this.idle.push(index);
      }
      if(this.workerIds.length){
        if(this.max_number_workers_handling != max_number_workers_handling){
          const configWorker = new ConfigWorkerMessage(new ConfigWorkerPayload(max_number_workers_handling, max_number_workers_handling));
          this.workerIds.forEach(workerIdx=>{
            this.postMessage(workerIdx, configWorker);
          });
        }
      }
      this.max_number_workers = max_number_workers;
      this.max_number_workers_handling = max_number_workers_handling;

    }

    private handleWorkerMessage(workerIdx, event) {
        const message = <WWMessage>event.data;
        if (this.workerListeners[workerIdx])
            this.workerListeners[workerIdx].next(message);
    }
    private handleWorkerError(name, event) {
        throw { error: "Error at " + name, event }
    }

    private generateWorkerId(): number {
        if (this.idle.length) {
            const index = this.idle.pop();
            return index;
        }
        return -1;
        // for (let index = 0; index < this.maxWorker; index++) {
        //     if (!this._workers[index]) {
        //         return index;
        //     }
        // }
        // return -1;
    }

    private setIdleWorker(workerId) {
        const index = this.idle.findIndex(e => e == workerId);
        if (index == -1) {
            this.idle.push(workerId);
            const timeout = this.timeoutIdle[workerId];
            if (timeout) {
                clearTimeout(timeout);
            }
            this.timeoutIdle[workerId] = setTimeout(() => {
                this.removeWorker(workerId);
            },  this.TERMINATE_WORKER_TIMEOUT); //10 s
        }
    }

    private getIdleWorker() {
        if (this.idle.length) {
            const workerId = this.idle.pop();
            const timeout = this.timeoutIdle[workerId];
            if (timeout) {
                clearTimeout(timeout);
            }
            return workerId;
        }
        return -1;
    }

    get numberWorkers(): number {
        return Object.keys(this._workers).length;
    }

    get workerIds(): number[] {
        return Object.keys(this._workers).map(e=>parseInt(e));
    }

    isMaxWorker(): boolean {
        if (!this.idle.length) {
            return true;
        }
        return false
    }

    createWorker(name: string, cachePort?: MessagePort) {
        const workerIdx = this.getIdleWorker();
        if (workerIdx == -1) throw { error: "Could not create Worker" + name };
        this.numberWorkerCreated++;
        if (this._workers[workerIdx]) {
            return workerIdx;
        }
        var worker = new Worker(`${this.workerPath}handlingWorker.js`, { type: 'module', name: name + workerIdx });
        worker.onerror = (event) => this.handleWorkerError(name + workerIdx, event);
        this.workerListeners[workerIdx] = new Subject<WWMessage>();
        worker.onmessage = (event: MessageEvent) => this.handleWorkerMessage(workerIdx, event);
        this._workers[workerIdx] = worker;
        if (name.startsWith(NAME_OF_WORKER_HANDLING_CHILD)) {
            let workerPortMessage = new PortConfigurationMessage(new PortPayload(name + workerIdx, `/api${API_BASE_HREF}`), null);
            worker.postMessage(workerPortMessage);
        } else {
            const msgChannel: MessageChannel = new MessageChannel();
            const workerPortMessage = new PortConfigurationMessage(new PortPayload(name + workerIdx, `/api${API_BASE_HREF}`), msgChannel.port1);
            const cachePortMessage = new PortConfigurationMessage(new PortPayload(name + workerIdx, `/api${API_BASE_HREF}`), msgChannel.port2);
            worker.postMessage(workerPortMessage, [workerPortMessage.messagePort]);
            cachePort.postMessage(cachePortMessage, [cachePortMessage.messagePort]);
        }
        const configWorker = new ConfigWorkerMessage(new ConfigWorkerPayload(this.max_number_workers_handling, this.max_number_workers_handling));
        this.postMessage(workerIdx, configWorker);
        return workerIdx;
    }

    postMessage(workerId: number, message: WWMessage): Observable<WWMessage> {
        if (this._workers[workerId]) {
            this._workers[workerId].postMessage(message);
            return this.workerListeners[workerId].pipe(filter(x => x.clientProcessId === message.clientProcessId))
        }
        return of(new CancelMessage(message.clientProcessId))
    }

    terminate(workerId, callback: Function) {
        const worker = this._workers[workerId];
        if (worker) {
            this.postMessage(workerId, new TerminateWorkerMessage(WorkQueue.getNextId(), null)).pipe(
              first()
            ).subscribe((message) => {
                // this.removeWorker(workerId, callback);
                this.setIdleWorker(workerId)
                callback();
            })
        } else {
            callback()
        }
    }

    terminateAll(callback) {
        const workers$ = this.workerIds.map(workerId =>
          this.postMessage(workerId, new TerminateWorkerMessage(WorkQueue.getNextId(), null)).pipe(first())
          );
        if (workers$.length) {
          const timeout = setTimeout(() => {
              callback()
          }, 10000);
            forkJoin(workers$).subscribe(() => {
                clearTimeout(timeout);
                callback();
            })
        } else {
            callback();
        }
    }

    removeWorker(workerId) {
      console.log("removeWorker", this._workerId, workerId)
        const worker = this._workers[workerId];
        const workerListener = this.workerListeners[workerId];
        if (worker) {
            worker.onmessage = null;
            worker.onerror = null;
            worker.terminate();
            workerListener.unsubscribe();
            delete this.workerListeners[workerId];
            delete this._workers[workerId];
        }
    }
}
