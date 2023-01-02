import { WorkerBase } from "../../../workerBase";
import { Observable, Observer, Subject } from "rxjs";
import { FindClosestClusterPayload, FindClosestClusterResponsePayload } from "../../payloads/featureClusterer/findClosestClusterPayload";
import { WWMessage } from "../../messages/message";
import { ClientProcess } from "../clientProcess";
import { ResultResponse } from "../../messages/resultResponse";
import { WorkQueue } from "../../workQueue";
import { CalculateClusterStatsMessage } from "../../messages/doClusterMesssage";
import { WWMessageType } from "../../messages/messageType";
import { tap } from "rxjs/operators";
import { CalculateClusterStatsPayload, CalculteClusterStatsResponsePayload } from "../../payloads/featureClusterer/calculateClusterStatsPayload";
import { LngLat, ICluster, Cluster, IEntry } from "../../../../client/app/shared/featureclusterer/featureclusterer";
import { CancelMessage } from "../../messages/cancelMessage";
import { IGeometry, IFeature } from "../../../../client/app/shared/map-utils/shapes-pure";

export class CalculateClusterStatsProcess extends ClientProcess {
  private payload: CalculateClusterStatsPayload;
  subject = new Subject<any>();
  private timeout: any;
  /*
   * method to return a weight value for each entry. defaults to counting the entries.
   */
  private WeightCalculator : (entry:IFeature<IGeometry>)=>number = (a)=>1; //default to count

  start(): Observable<WWMessage> {
    if (this.workerId != undefined) {
      return this.handleInAnotherWorker();
    } else {
      this.timeout = setTimeout(() => {
        try {
          const { clusters } = this.payload;
          let converged = true;
          let MaxWeight = 0;
          let MinWeight = 1E26;
          for (let i = 0; i < clusters.length; i++) {
            let oldCentroid = clusters[i].Centroid;
            let oldDeviation = clusters[i].Deviation;

            clusters[i] = this.RecalculateCentroid(clusters[i]);
            clusters[i] = this.RecalculateDeviation(clusters[i]);
            if(!clusters[i]) { //check null
              continue;
            }
            if (clusters[i].Deviation != oldDeviation || !LngLat.Equals(clusters[i].Centroid, oldCentroid)) {
              converged = false;
            }
            if (MaxWeight < clusters[i].Weight) {
              MaxWeight = clusters[i].Weight;
            }
            if (MinWeight > clusters[i].Weight) {
              MinWeight = clusters[i].Weight;
            }
          }
          const result = new ResultResponse(this.clientProcessId, new CalculteClusterStatsResponsePayload(clusters, converged, MinWeight, MaxWeight));
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
    this.payload = <CalculateClusterStatsPayload>initialMessage.data;
    this.WeightCalculator = this.payload.weightCalculator;
  }

  handleInAnotherWorker() {
    const clientProcessId = WorkQueue.getNextId();
    const calculateClusterStatsMessage = new CalculateClusterStatsMessage(clientProcessId, this.payload);
    this.addChild(clientProcessId);
    this.postMessage(this.workerId, calculateClusterStatsMessage).pipe(
      tap(e => e.messageType == WWMessageType.CANCEL ? this.removeChild(clientProcessId) : null),
    ).subscribe(message => {
      if (message.messageType === WWMessageType.ERROR) {
        this.subject.error("Error at handleInAnotherWorker calculateClusterStatsMessage");
      } else {
        const { data } = message;
        const result = new ResultResponse(this.clientProcessId, data);
        this.subject.next(result);
        this.subject.complete();
      }
    })
    return this.subject.asObservable();
  }

  CalculateWeight(cluster: ICluster) {
    cluster.Weight = cluster.Entries.map(a=>this.CalculateEntryWeight(a)).reduce((a,b)=>a+b);
    return cluster.Weight;
  }

  CalculateEntryWeight(entity: IEntry) {
    entity.Weight = Math.abs(this.WeightCalculator(entity.Feature)) + 1; //jd adding 1 to counteract weight calculations yielding 0
    return entity.Weight;
  }

  RecalculateCentroid(cluster: ICluster): ICluster {
    let storage: LngLat = new LngLat(0, 0);
    let c = this.CalculateWeight(cluster);
    for (let i = 0; i < cluster.Entries.length; i++) {

      let w = cluster.Entries[i].Weight;

      storage.Lat += w * cluster.Entries[i].Position.Lat;
      storage.Lng += w * cluster.Entries[i].Position.Lng;
    }
    storage.Lat /= c;
    storage.Lng /= c;
    cluster.Centroid = storage;
    return { ...cluster } as ICluster;
  }

  RecalculateDeviation(cluster: ICluster): ICluster {
    if (cluster.Weight == 0) { //
      // throw "No Entries";
      console.error("Cluster error",cluster);
      return null;
    }
    cluster.Outlier = null;
    cluster.OutlierDist = -1;

    let sumSquared: number = 0;
    for (let i = 0; i < cluster.Entries.length; i++) {
      const dist = LngLat.DistanceBetweenPoints(cluster.Entries[i].Position, cluster.Centroid);
      sumSquared += dist * dist;
      if (dist > cluster.OutlierDist) {
        cluster.OutlierDist = dist;
        cluster.Outlier = cluster.Entries[i];
        cluster.OutlierIndex = i;
      }
    }
    let meanSumSquared = sumSquared / cluster.Weight;
    let dev = Math.sqrt(meanSumSquared);
    cluster.Deviation = dev;
    return { ...cluster } as ICluster;
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

