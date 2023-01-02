
import { Subscription, Subject } from 'rxjs';
import { WWMessage } from './models/messages/message';
import { WWMessageType } from './models/messages/messageType';
import { WorkQueue } from './models/workQueue';
import { environment } from '../client/environments/environment';
import { filter } from 'rxjs/operators';
import { CustomWorker } from './worker';
import { NAME_OF_WORKER_HANDLING_CHILD } from '../client/app/shared/global_origin';
import { TerminateWorkerMessage } from './models/messages/terminateWorkerMessage';
import { ConfigWorkerPayload } from './models/payloads/configWorkerPayload';

export abstract class WorkerBase extends CustomWorker {
    public readonly workerPath = `${environment.baseUrl}assets/workers/`;
    public processingSubscriptions: Map<number, Subscription> = new Map<number, Subscription>();
    public messageAssignProcessing: Map<number, Set<number>> = new Map<number, Set<number>>();
    _workQueue: WorkQueue = new WorkQueue();
    _cachePort: MessagePort;
    cacheListener: Subject<WWMessage> = new Subject<WWMessage>();
    processMessage$ = new Subject<WWMessage>();
    abstract handleMessage(message: WWMessage, workerId?: number);
    abstract assignWork();
    abstract handleConfigurePort(message);

    constructor(public workerCtx) {
        super();
        // workerCtx as SharedWorkerGlobalScope
        this.workerCtx.addEventListener("message", (event: MessageEvent) => {
            this.onMessage(event);
        });
    }

    public checkCreateWorkerAvailable() {
        if (this.isMaxWorker() || this._workerId.startsWith(NAME_OF_WORKER_HANDLING_CHILD)) {
            return false;
        }
        return true;
    }

    public getWorkerToAssign(){
      const keys = Array.from(this.messageAssignProcessing.keys());
      let workerId = -1;  // -1 : current thread
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        if(this.messageAssignProcessing.get(key).size < this.messageAssignProcessing.get(workerId).size){
          workerId = key;
        }
      }
      return workerId;
    }

    private onMessage(event: MessageEvent) {
        let message: WWMessage = <WWMessage>event.data;
        switch (message.messageType) {
            case WWMessageType.CONFIGURE_PORTS: {
                this.handleConfigurePort(message);
                break;
            }
            case WWMessageType.CANCEL: {
                const { clientProcessId } = message;
                this.deleteProcess(clientProcessId);
                break;
            }
            case WWMessageType.TERMINATE_WORKER: {
                const { clientProcessId, data } = message;
                this.closeWorker(clientProcessId);
                break;
            }

            case WWMessageType.CONFIG_WORKER: {
              const { max_number_workers, max_number_workers_handling } = <ConfigWorkerPayload>message.data;
              this.configWorker(max_number_workers, max_number_workers_handling);
              break;
            }

            default:
                message.responseResult = new Subject<WWMessage>();
                message.responseResult.subscribe(message => {
                    this.responseMessage(message);
                })
                this.assign(message);
                break;
        }
    }

    assign(message: WWMessage) {
        this._workQueue.enqueue(message);
        this.assignWork();
    }

    reassign(message: WWMessage){ // assign job in same worker
      message.responseResult = new Subject<WWMessage>();
      this.assign(message);
      return  message.responseResult.asObservable();
    }

    cleanupProcess(clientProcessId: number): void {
        this.deleteProcess(clientProcessId);
        // this.assignWork();
    }

    addProcess(clientProcessId: number, subscription: Subscription) {
        this.processingSubscriptions.set(clientProcessId, subscription);
    }

    deleteProcess(clientProcessId: number) {
        this._workQueue.removeClientProcessId(clientProcessId);
        const cp = this.processingSubscriptions.get(clientProcessId);
        if (cp) {
            cp.unsubscribe();
            this.processingSubscriptions.delete(clientProcessId);
        }
    }

    addMessageAssignProcessing(workerId:number, clientProcessId: number){
      if(this.messageAssignProcessing.has(workerId)){
        this.messageAssignProcessing.get(workerId).add(clientProcessId);
      }else{
        this.messageAssignProcessing.set(workerId, new Set<number>().add(clientProcessId));
      }
    }

    deleteMessageAssignProcessing(workerId:number, clientProcessId: number){
      if(this.messageAssignProcessing.has(workerId)){
        this.messageAssignProcessing.get(workerId).delete(clientProcessId);
      }
    }

    checkTerminateWorker(workerId: number){
      if(this.messageAssignProcessing.has(workerId)){
        return !Array.from(this.messageAssignProcessing.get(workerId)).length
      }
      return true;
    }

    responseMessage(message: WWMessage) {
        this.workerCtx.postMessage(message);
    }
    postCacheMessage(message: WWMessage) {
        this._cachePort.postMessage(message);
        return this.cacheListener.asObservable().pipe(filter(x => x.clientProcessId === message.clientProcessId))
    }

    closeWorker(clientProcessId) {
        this._workQueue.clear();
        this.terminateAll(() => {
            this.responseMessage(new TerminateWorkerMessage(clientProcessId, { clear: true }));
        });
    }
}

