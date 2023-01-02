import { WorkerBase } from './workerBase';
import { WWMessage } from './models/messages/message';
import { WWMessageType } from './models/messages/messageType';
import { PortPayload } from './models/payloads/PortPayload';
import { ClientProcess } from './models/processes/clientProcess';
import { Subject, asapScheduler } from 'rxjs';
import { ResultResponse } from './models/messages/resultResponse';
import { ErrorMessage } from './models/messages/errorMessage';
import { CancelMessage } from './models/messages/cancelMessage';
import { NAME_OF_WORKER_HANDLING_CHILD } from '../client/app/shared/global_origin';
import { observeOn } from 'rxjs/operators';
import { WorkQueue } from './models/workQueue';
import { createProcess_handling } from './processes_handling';


export class WorkerHandling extends WorkerBase {
    constructor(workerCtx) {
        super(workerCtx);
        WorkQueue.initId(10000);
    }
    assignWork() {
      if (this._workQueue.count === 0) return;
      const message = this._workQueue.dequeue();
      const handlingInWorker = this.handleMessageOnWorker(message);
      const workerId = this.getWorkerToAssign();
      if (handlingInWorker && this.checkCreateWorkerAvailable()) {
        const workerId = this.createWorker(NAME_OF_WORKER_HANDLING_CHILD + this._workerId + '_', this._cachePort);
        this.handleMessage(message, workerId);
      } else if (handlingInWorker && workerId !== -1) {
        this.handleMessage(message, workerId);
      } else {
        this.handleMessage(message);
      }
      this.assignWork();
    }
    handleConfigurePort(message: any) {
        let pp = <PortPayload>message.data;
        const {workerId} = pp;
        this._workerId = workerId;
        if (this._workerId.startsWith(NAME_OF_WORKER_HANDLING_CHILD)) {
            return;
        }
        this._cachePort = message.messagePort;
        this._cachePort.start();
        this._cachePort.addEventListener('message', (event: MessageEvent) => {
            const message = <WWMessage>event.data;
            this.cacheListener.next(message);
        })
    }

    handleMessageOnWorker(message: WWMessage) {
      if (message.messageType == WWMessageType.FILTER_SHAPES
        || message.messageType == WWMessageType.FIND_CLOSEST_CLUSTER
        || message.messageType == WWMessageType.CLIPPING_VORONOI_CLUSTER) {
        return true;
      }
      return false;
    }

    handleMessage(request: WWMessage, workerId: number = null) {
        const cp = createProcess_handling(this, request);
        if(!cp) return;
        cp.workerId = workerId;
        const subscription = cp.start().pipe(observeOn(asapScheduler)).subscribe(
            message => this.handleResult(message, request.responseResult),
            err => this.handleError(err, cp, request.responseResult));
        subscription.add(() => {
            if (!cp.isCanceled)
                this.handleCancel(cp, request.responseResult);
        })
        this.addProcess(request.clientProcessId, subscription);
      this.addMessageAssignProcessing(workerId != null ? workerId : -1, cp.clientProcessId)
    }
    handleResult(message: ResultResponse, subject: Subject<WWMessage>) {
        if (subject) {
            subject.next(message);
        }
    }
    handleError(err, cp: ClientProcess, subject: Subject<WWMessage>) {
        // console.error(err);
        const message = new ErrorMessage(cp.clientProcessId, { error: err });
        if (subject) {
            subject.next(message);
        }
    }
    handleCancel(cp: ClientProcess, subject: Subject<WWMessage>) {
        if (cp) {
          const {clientProcessId , workerId} = cp;
            cp.cancelProcess();
            if (workerId != null) {
                this.deleteMessageAssignProcessing(workerId, clientProcessId);
                if(this.checkTerminateWorker(workerId)){
                  this.terminate(workerId, () => {
                    // cp.cancelProcess();
                    if (subject) {
                        const message = new CancelMessage(clientProcessId);
                        subject.next(message);
                    }
                    this.assignWork();
                  });
                }
            } else {
                this.deleteMessageAssignProcessing(-1, clientProcessId);
                // cp.cancelProcess();
                if (subject) {
                    const message = new CancelMessage(cp.clientProcessId);
                    subject.next(message);
                }
                this.assignWork();
            }
        }
    }
}
