import { ClientProcess } from './clientProcess';
import { WWMessage } from '../messages/message';
import { WorkerBase } from '../../workerBase';
import { Observable, Subject, Subscription } from 'rxjs';
import { ResultResponse } from '../messages/resultResponse';
import { FilterShapesPayload } from '../payloads/filterShapePayload';
import { LayerDataFunction } from '../../functions';
import { FilterShapesMessage } from '../messages/filterShapesMesssage';
import { WorkQueue } from '../workQueue';
import { WWMessageType } from '../messages/messageType';
import { CancelMessage } from '../messages/cancelMessage';
import { tap } from 'rxjs/operators';

export class FilterShapesProcess extends ClientProcess {
  private payload: FilterShapesPayload;
  private timeout: any;
  subject = new Subject<any>();
  start(): Observable<WWMessage> {
    if (this.workerId != undefined) {
      // console.log("FilterShapesProcess in worker", this.payload.tileId)
      return this.handleInAnotherWorker();
    } else {
      try {
        this.timeout = setTimeout(() => {
          const tileFilter = LayerDataFunction.getPredicate(this.payload.filter, this.payload.layer);
          const featureFilter = LayerDataFunction.createFeatureFilter(tileFilter, this.payload.layer.schema);
          const shapes: any[] = [];
          const shapesDeleted: any[] = [];
          this.payload.features.forEach(data => {
            data.shapeId = data.PeriscopeId.toString();
            if (featureFilter(data) && (!this.payload.selectedIds || (this.payload.selectedIds.includes(data.shapeId)))) {
              shapes.push(data);
            }else{
              shapesDeleted.push(data);
            }
          })
          const result = new ResultResponse(this.clientProcessId, {shapes, shapesDeleted});
          this.subject.next(result);
          this.subject.complete();
        }, 0);
      } catch (error) {
        this.subject.error(error);
      }
      return this.subject.asObservable();
    }
  }

  constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
    super(parentWorker);
    this.messageProcessing = initialMessage;
    this.clientProcessId = initialMessage.clientProcessId;
    this.payload = <FilterShapesPayload>initialMessage.data;
  }

  handleInAnotherWorker() {
    const clientProcessId = WorkQueue.getNextId();
    const filterShapesMessage = new FilterShapesMessage(clientProcessId, this.payload);
    this.addChild(clientProcessId);
    this.postMessage(this.workerId, filterShapesMessage).pipe(
      tap(e => e.messageType == WWMessageType.CANCEL ? this.removeChild(clientProcessId) : null),
    ).subscribe(message => {
      if (message.messageType === WWMessageType.ERROR) {
        this.subject.error("Error at handleInAnotherWorker filterShapesProcess");
      } else {
        const { data } = message;
        const result = new ResultResponse(this.clientProcessId, data);
        this.subject.next(result);
        this.subject.complete();
      }
    })
    return this.subject.asObservable();
  }
  cancelProcess() {
    clearTimeout(this.timeout);
    if (!this.subject.isStopped) {
      this.subject.complete();
    }
    this.childClientProcessIds.forEach(e => {
      const message = new CancelMessage(e);
      this.postMessage(this.workerId, message);
    })
    super.cancelProcess();
  }
}

