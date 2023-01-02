import { WorkerBase } from "../../../workerBase";
import { Observable, Observer, Subject } from "rxjs";
import { FindClosestClusterPayload, FindClosestClusterResponsePayload } from "../../payloads/featureClusterer/findClosestClusterPayload";
import { WWMessage } from "../../messages/message";
import { ClientProcess } from "../clientProcess";
import { ResultResponse } from "../../messages/resultResponse";
import { LngLat } from "../../../../client/app/shared/featureclusterer/featureclusterer";
import { WorkQueue } from "../../workQueue";
import { FindClosestClusterMessage } from "../../messages/doClusterMesssage";
import { WWMessageType } from "../../messages/messageType";
import { tap } from "rxjs/operators";
import { CancelMessage } from "../../messages/cancelMessage";

export class FindClosestClusterProcess extends ClientProcess {

  private payload: FindClosestClusterPayload;
  subject = new Subject<any>();
  private timeout: any;
  start(): Observable<WWMessage> {
    if (this.workerId != undefined) {
      return this.handleInAnotherWorker();
    } else {
      this.timeout = setTimeout(() => {
        try {
          const { clusterCentroids, featurePositions } = this.payload;
          const closestClusterIndexs = [];
          featurePositions.forEach(position => {
            let closestClusterIndex: number;
            let closestDistance: number = 99999999;

            for (let j = 0; j < clusterCentroids.length; j++) {
              if (!(clusterCentroids[j]))
                continue;

              const dist = LngLat.DistanceBetweenPoints(position, clusterCentroids[j]);
              if (dist < closestDistance) {
                closestDistance = dist;
                closestClusterIndex = j;
              }
            }
            closestClusterIndexs.push(closestClusterIndex);
          })
          const result = new ResultResponse(this.clientProcessId, new FindClosestClusterResponsePayload(closestClusterIndexs));
          this.subject.next(result);
          this.subject.complete();
        } catch (error) {
          this.subject.error(error);
        }
      }, 0);
      return this.subject.asObservable();
    }
  }

  constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
    super(parentWorker);
    this.messageProcessing = initialMessage;
    this.clientProcessId = initialMessage.clientProcessId;
    this.payload = <FindClosestClusterPayload>initialMessage.data;
  }

  handleInAnotherWorker() {
    const clientProcessId = WorkQueue.getNextId();
    const findClosestClusterMessage = new FindClosestClusterMessage(clientProcessId, this.payload);
    this.addChild(clientProcessId);
    this.postMessage(this.workerId, findClosestClusterMessage).pipe(
      tap(e => e.messageType == WWMessageType.CANCEL ? this.removeChild(clientProcessId) : null),
    ).subscribe(message => {
      if (message.messageType === WWMessageType.ERROR) {
        this.subject.error("Error at handleInAnotherWorker FindClosestClusterMessage");
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
    });
    super.cancelProcess();
  }
}

