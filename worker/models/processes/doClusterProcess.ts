import { ClientProcess } from './clientProcess';
import { WWMessage } from '../messages/message';
import { WorkerBase } from '../../workerBase';
import { Observable, Subject } from 'rxjs';
import { ResultResponse } from '../messages/resultResponse';
import { WorkQueue } from '../workQueue';
import { WWMessageType } from '../messages/messageType';
import { CancelMessage } from '../messages/cancelMessage';
import { tap } from 'rxjs/operators';
import { DoClusterPayload } from '../payloads/doClusterPayload';
import { DoClusterMessage } from '../messages/doClusterMesssage';
import { FeatureClusterer } from '../../../client/app/shared/featureclusterer/featureclusterer';

export class DoClusterProcess extends ClientProcess {
  private payload: DoClusterPayload;
  private timeout: any;
  subject = new Subject<any>();
  start(): Observable<WWMessage> {
    if (this.workerId != undefined) {
      // console.log("FilterShapesProcess in worker", this.payload.tileId)
      return this.handleInAnotherWorker();
    } else {
      setTimeout(() => {
        try {
          const featureClusterer = new FeatureClusterer();
          const { features, maxRepetitions, numInitialClusters, targetDeviation } = this.payload;
          featureClusterer.AddFeatures(features.map((item)=>item.data));
          featureClusterer.Prepare(numInitialClusters);
          featureClusterer.DoCluster(maxRepetitions, targetDeviation);
          const dif = featureClusterer.MaxWeight - featureClusterer.MinWeight;
          console.log(featureClusterer);
          const result = new ResultResponse(this.clientProcessId, {
            clusters: featureClusterer.Clusters.map(e => ({
              centroid: [e.Centroid.Lng, e.Centroid.Lat],
              weight: e.Weight,
              ratioScale: (e.Weight - featureClusterer.MinWeight) / dif
            }))
          });
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
    this.payload = <DoClusterPayload>initialMessage.data;
  }

  handleInAnotherWorker() {
    const clientProcessId = WorkQueue.getNextId();
    const doClusterMessage = new DoClusterMessage(clientProcessId, this.payload);
    this.addChild(clientProcessId);
    this.postMessage(this.workerId, doClusterMessage).pipe(
      tap(e => e.messageType == WWMessageType.CANCEL ? this.removeChild(clientProcessId) : null),
    ).subscribe(message => {
      if (message.messageType === WWMessageType.ERROR) {
        this.subject.error("Error at handleInAnotherWorker DoClusterMessage");
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

