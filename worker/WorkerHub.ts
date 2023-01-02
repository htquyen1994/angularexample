import { API_BASE_HREF } from '../client/app/shared/global_origin';
import { Subject, Observable } from 'rxjs';
import { environment } from '../client/environments/environment';
import { WorkQueue } from './models/workQueue';
import { WWMessage } from './models/messages/message';
import { PortConfigurationMessage } from './models/messages/portConfigurationMessage';
import { PortPayload } from './models/payloads/PortPayload';
import { WorkItem } from './models/WorkItem';
import { WWMessageType } from './models/messages/messageType';
import { WorkItemType, ErrorType } from './models/WorkItemType';
import { ViewportTilesMessage } from './models/messages/viewportTilesMessage';
import { filter, takeWhile } from 'rxjs/operators';
import { ResultResponse } from './models/messages/resultResponse';
import { CancelMessage } from './models/messages/cancelMessage';
import { DeleteOverlayMessage } from './models/messages/deleteOverlayMessage';
import { InvalidCacheMessage } from './models/messages/invalidCacheMessage';
import { ConfigWorkerMessage } from './models/messages/configWorkerMessage';
import { ConfigWorkerPayload } from './models/payloads/configWorkerPayload';
import { TerminateWorkerMessage } from './models/messages/terminateWorkerMessage'
export class WorkerHub {
  public readonly workerPath = `${environment.baseUrl}assets/workers/`;
  private _cacheWorker: any;
  private _workers: { [key: string]: Worker } = {}
  clientMessage$ = new Subject<WWMessage>();
  loading$ = new Subject<number>();
  workerListeners: { [key: string]: Subject<WWMessage> } = {}
  constructor(private success?: Function, private err_cb?: Function) {
    // workerCtx as WorkerGlobalScope
    // create the workers
    try {
      if (window.SharedWorker) {
        this._cacheWorker = new SharedWorker(`${this.workerPath}cacheworker_shared.js`, { type: 'module', name: 'cache' });
      } else {
        this._cacheWorker = new Worker(`${this.workerPath}cacheworker.js`, { type: 'module', name: 'cache' });
      }
      WorkQueue.initId(0);
      this.createWorker(0);
      if (success) success();
    } catch (error) {
      if (err_cb) err_cb({ type: ErrorType.WORKER_INIT });
    }
  }

  assignWorkItem(workitem: WorkItem): number {
    try {
      const message = this.decorateToMessage(workitem);
      this.assignMessage(0, message);
      return message.clientProcessId;
    } catch (error) {
      console.error(error);
      if (this.err_cb) this.err_cb({ type: ErrorType.COMMON, error });
    }
  }

  postMessage(workerId: number, message: WWMessage): Observable<WWMessage> {
    this._workers[workerId].postMessage(message);
    return this.workerListeners[workerId].pipe(filter(x => x.clientProcessId === message.clientProcessId))
  }

  closeSharedWorker() {
    const message = new TerminateWorkerMessage(-1, null);
    this.postMessageCache(message);
  }

  private assignMessage(workerIdx: number, message: WWMessage) {
    this.postMessage(workerIdx, message).pipe(
      takeWhile(_message => message.messageType !== WWMessageType.CANCEL)
    ).subscribe(
      _message => this.handleResult(this.clientMessage$, { ..._message, clientProcessId: message.clientProcessId }),
      err => this.handleError(err, workerIdx, message));
  }

  private createWorker(workerIdx: number) {
    var worker = new Worker(`${this.workerPath}hubworker.js`, { type: 'module', name: 'hubworker' + workerIdx });
    worker.onerror = (event) => {
      throw { error: "Error at hubworker" + workerIdx };
    };
    let msgChannel: MessageChannel = new MessageChannel();
    let workerPortMessage = new PortConfigurationMessage(new PortPayload('hubworker' + workerIdx, `/api${API_BASE_HREF}`), msgChannel.port1);
    let cachePortMessage = new PortConfigurationMessage(new PortPayload('hubworker' + workerIdx, `/api${API_BASE_HREF}`), msgChannel.port2);
    this.workerListeners[workerIdx] = new Subject<WWMessage>();
    worker.addEventListener('message', (event: MessageEvent) => {
      const message = <WWMessage>event.data;
      this.workerListeners[workerIdx].next(message);
    })
    worker.postMessage(workerPortMessage, [workerPortMessage.messagePort]);
    if (this._cacheWorker instanceof Worker) {
      this._cacheWorker.onmessage = (event: MessageEvent) => {
        const message = <WWMessage>event.data;
        if (message.messageType === WWMessageType.ERROR) {
          console.error(message)
          const { type } = <any>message.data;
          switch (type) {
            case ErrorType.UNAUTHORIZED:
              this.handleUnauthorized();
              break;
            case ErrorType.SERVER_BREAKDOWN:
              this.handleServerBreakdown();
              break;

            default:
              break;
          }
        }
      }
    } else {
      this._cacheWorker.port.onmessage = (event: MessageEvent) => {
        const message = <WWMessage>event.data;
        if (message.messageType === WWMessageType.ERROR) {
          if (message.messageType === WWMessageType.ERROR) {
            console.error(message)
            const { type } = <any>message.data;
            switch (type) {
              case ErrorType.UNAUTHORIZED:
                this.handleUnauthorized();
                break;
              case ErrorType.SERVER_BREAKDOWN:
                this.handleServerBreakdown();
                break;

              default:
                break;
            }
          }
        }
      }
    }
    this.postMessageCache(cachePortMessage, [cachePortMessage.messagePort]);
    this._workers[workerIdx] = worker;
  }

  postMessageCache(message, transfers?) {
    if (this._cacheWorker instanceof Worker) {
      this._cacheWorker.postMessage(message, transfers);
    } else {
      this._cacheWorker.port.postMessage(message, transfers);
    }
  }

  private decorateToMessage(workitem: WorkItem) {
    switch (workitem.workItemType) {
      case WorkItemType.UPDATEOVERLAY:
        return new ViewportTilesMessage(WorkQueue.getNextId(), workitem.data);
      case WorkItemType.CANCELOVERLAY:
        return new CancelMessage(workitem.data);
      case WorkItemType.DELETEOVERLAY:
        return new DeleteOverlayMessage(WorkQueue.getNextId(), workitem.data);
      case WorkItemType.INVALIDCACHE:
        return new InvalidCacheMessage(WorkQueue.getNextId(), workitem.data);
      case WorkItemType.CONFIG_WORKER:
        const { max_number_workers, max_number_workers_handling } = workitem.data;
        return new ConfigWorkerMessage(new ConfigWorkerPayload(max_number_workers, max_number_workers_handling));
      default:
        break;
    }
    throw "Not implement";
  }
  private handleResult(subject: Subject<WWMessage>, message: ResultResponse) {
    const { messageType, data } = message;
    if (messageType == WWMessageType.ERROR && data['type'] == ErrorType.UNAUTHORIZED) {
      subject.error({ type: ErrorType.UNAUTHORIZED });
      // window.location.href = `${window.location.href}?${Math.random()}`;
    }
    if (subject) {
      subject.next(message);
    }
  }
  private handleError(err, workerId, postedMessage) {
    const { clientProcessId } = postedMessage;
    const cancleMessage = new CancelMessage(clientProcessId);
    this.assignMessage(workerId, cancleMessage);
    console.error(err);
    if (this.err_cb) this.err_cb({ type: ErrorType.COMMON, error: err });
    // throw err;
  }

  private handleUnauthorized() {
    if (this.err_cb) this.err_cb({ type: ErrorType.UNAUTHORIZED })
  }
  private handleServerBreakdown() {
    if (this.err_cb) this.err_cb({ type: ErrorType.SERVER_BREAKDOWN })
  }
}
