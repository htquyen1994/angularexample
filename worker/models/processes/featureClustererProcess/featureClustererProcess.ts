import { ClientProcess } from '../clientProcess';
import { WWMessage } from '../../messages/message';
import { WorkerBase } from '../../../workerBase';
import { Observable, Subject, forkJoin, Observer, throwError, of, asyncScheduler, empty } from 'rxjs';
import { ResultResponse } from '../../messages/resultResponse';
import { WorkQueue } from '../../workQueue';
import { WWMessageType } from '../../messages/messageType';
import { CancelMessage } from '../../messages/cancelMessage';
import { tap, switchMap, expand, take, takeUntil, takeWhile, finalize, map, observeOn } from 'rxjs/operators';
import { DoClusterPayload } from '../../payloads/doClusterPayload';
import { DoClusterMessage, FindClosestClusterMessage, CalculateClusterStatsMessage } from '../../messages/doClusterMesssage';
import { Cluster, Entry, LngLat, ILngLat, ICluster } from '../../../../client/app/shared/featureclusterer/featureclusterer';
import { IFeature, IGeometry } from '../../../../client/app/shared/map-utils/shapes-pure';
import { FindClosestClusterPayload, FindClosestClusterResponsePayload } from '../../payloads/featureClusterer/findClosestClusterPayload';
import { CalculateClusterStatsPayload, CalculteClusterStatsResponsePayload } from '../../payloads/featureClusterer/calculateClusterStatsPayload';
export class FeatureClustererProcess extends ClientProcess {
  Features: IFeature<IGeometry>[] = [];
  Clusters: Cluster[] = [];
  Entries: Entry[] = [];
  Deviation: number;
  IsInitialized: boolean = false;
  MaxWeight: number;
  MinWeight: number;
  private divideProcess = 1;

  GetFeatureCount() {
    return this.Features.length;
  };

  GetClusterCount() {
    return this.Clusters.length;
  };
  private payload: DoClusterPayload;
  private timeout: any;
  subject = new Subject<any>();

  constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
    super(parentWorker);
    this.messageProcessing = initialMessage;
    this.clientProcessId = initialMessage.clientProcessId;
    this.payload = <DoClusterPayload>initialMessage.data;
    this.divideProcess = this._parentWorker.max_number_workers + 1;
  }

  start(): Observable<WWMessage> {
    if (this.workerId != undefined) {
      // console.log("FilterShapesProcess in worker", this.payload.tileId)
      return this.handleInAnotherWorker();
    } else {
      this.timeout = setTimeout(() => {
        try {
          const { features, maxRepetitions, numInitialClusters, targetDeviation } = this.payload;
          this.addFeatures(features.map((item) => item.data));
          this.prepare(numInitialClusters);
          this.doCluster(maxRepetitions, targetDeviation).subscribe(complete => {
            const dif = this.MaxWeight - this.MinWeight;
            console.log("Features count", this.Features.length);
            const result = new ResultResponse(this.clientProcessId, {
              clusters: this.Clusters.map(e => ({
                type: 'Feature',
                centroid: [e.Centroid.Lng, e.Centroid.Lat],
                geometry: {
                  type: "Point",
                  coordinates: [e.Centroid.Lng, e.Centroid.Lat]
                },
                properties: {
                  weight: e.Weight,
                  ratioScale: (e.Weight - this.MinWeight) / dif,
                  maxWeight: this.MaxWeight,
                  minWeight: this.MinWeight
                }
              })).sort((a, b) => b.properties.weight - a.properties.weight),
            });
            this.subject.next(result);
            this.subject.complete();
          });
        } catch (error) {
          this.subject.error(error);
        }
      }, 0);
      return this.subject.asObservable();
    }
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

  addFeatures(feats: IFeature<IGeometry> | IFeature<IGeometry>[]) {
    if (feats == undefined) {
      return;
    }

    if (!(feats instanceof Array)) {
      feats = [feats]
    }
    this.Features = this.Features.concat(feats);
  };

  prepare(numInitialClusters: number) {

    numInitialClusters = Math.min(numInitialClusters, this.GetFeatureCount());

    let sortList: { Entry: Entry, rnd: number }[] = [];
    let c = this.GetFeatureCount();
    for (let i = 0; i < c; i++) {
      sortList.push({ Entry: new Entry(this.Features[i]), rnd: this.Features[i].PeriscopeId });
    }
    sortList = Array.from(sortList).sort((a, b) => { return a.rnd == b.rnd ? 0 : a.rnd > b.rnd ? 1 : -1 });

    let clusters: Cluster[] = [];

    //debugger;

    //let usedIndices: number[] = [];

    //randomly assign features to a cluster
    for (let i = 0; i < numInitialClusters; i++) {
      let cluster = new Cluster();
      //let idx: number;
      //do {
      //  idx = Math.floor(Math.random() * c);
      //} while (usedIndices.indexOf(idx) > -1);

      //usedIndices.push(idx);
      console.log("generating cluster ", i)

      let idx = Math.floor(i * (sortList.length / numInitialClusters))

      cluster.Centroid = new LngLat(sortList[idx].Entry.Position.Lng, sortList[sortList.length - 1 - idx].Entry.Position.Lat);

      clusters.push(cluster);
    }

    this.Clusters = clusters;
    let e = [];
    Array.from(sortList).forEach(a => e.push(a.Entry));
    this.Entries = e;
    this.IsInitialized = true;
  };

  doCluster(maxRepetitions: number, targetDeviation: number): Observable<any> {
    if (!this.IsInitialized)
      throw "UnInitialized";
    let rep: number = 0;

    return this.clusteringAlgo(rep, maxRepetitions, targetDeviation).pipe(
      tap((val) => { console.log(val); })
    )
  };

  clusteringAlgo(rep, maxRepetitions, targetDeviation): Observable<{ rep: number, improvementPerc: number }> {
    const start = new Date().getTime();
    let f = this.GetFeatureCount();

    for (let i = 0; i < this.GetClusterCount(); i++) {
      this.Clusters[i].Entries = []; //reset the collection on features assigned to a cluster
    }
    const deadClusters: Cluster[] = [];
    const findALlClosestCluster$ = this.findAllClosestCluster();
    return findALlClosestCluster$.pipe(
      switchMap(clusterIndexs => {
        const closestClusterIndexs = [...clusterIndexs];
        closestClusterIndexs.forEach((clusterIndex, featureIndex) => this.Clusters[clusterIndex].Entries.push(this.Entries[featureIndex]))
        let newClusters: Cluster[] = [];
        for (let i = 0; i < this.GetClusterCount(); i++) {
          if (this.Clusters[i].GetCount() > 0) {
            newClusters.push(this.Clusters[i]);
          }
          else {
            deadClusters.push(this.Clusters[i]);
          }
        }
        this.Clusters = newClusters;
        const calcAllClusterStats$ = this.calcAllClusterStats();
        return calcAllClusterStats$
      }),
      switchMap((data) => {
        const { clusters, converged, maxWeight, minWeight } = data;
        this.MaxWeight = maxWeight;
        this.MinWeight = minWeight;
        clusters.forEach((cluster, i) => {
          if(!cluster){
            deadClusters.push(this.Clusters[i]);
            this.Clusters[i] = null;
            return;
          }
          const { Centroid, Outlier, OutlierDist, Deviation, OutlierIndex, Weight } = cluster;
          this.Clusters[i].Centroid = new LngLat(Centroid.Lng, Centroid.Lat);
          this.Clusters[i].Outlier = Entry.fromIEntry(Outlier);
          this.Clusters[i].OutlierDist = OutlierDist;
          this.Clusters[i].Deviation = Deviation;
          this.Clusters[i].Weight = Weight;
        })
        this.Clusters = this.Clusters.filter(e=>e);
        //calculate the cluster stats
        //@loc it would be good to partition this bit across worker threads
        // for (let i = 0; i < this.GetClusterCount(); i++) {
        //   let oldCentroid = this.Clusters[i].Centroid;
        //   let oldDeviation = this.Clusters[i].Deviation;

        //   this.Clusters[i].RecalculateCentroid();
        //   this.Clusters[i].RecalculateDeviation();


        //   if (this.MaxWeight < this.Clusters[i].GetCount()) {
        //     this.MaxWeight = this.Clusters[i].GetCount();
        //   }
        //   if (this.MinWeight > this.Clusters[i].GetCount()) {
        //     this.MinWeight = this.Clusters[i].GetCount();
        //   }
        // }

        //calculate the solution stats
        let clusterDeviation = 0;
        let clusterAvg = 0;
        for (let i = 0; i < this.GetClusterCount(); i++) {
          clusterAvg += this.Clusters[i].Deviation;
        }
        clusterAvg /= this.GetClusterCount();

        let sumSquared = 0;
        for (let i = 0; i < this.GetClusterCount(); i++) {
          let dist = this.Clusters[i].Deviation - clusterAvg;
          sumSquared += dist * dist;

        }

        let meanSumSquared = sumSquared / this.GetClusterCount();
        const dev = Math.sqrt(meanSumSquared);

        const improvementPerc = (this.Deviation - dev) / dev;

        this.Deviation = dev;
        console.log("dev:", dev);

        if (deadClusters.length > 0) { // if clusters collapsed regenerate them with the centroid of the outliers of other clusters
          let outliers = this.Clusters.map(a => { return { outlierDist: a.OutlierDist, outlier: a.Outlier }; });

          outliers.sort((a, b) => b.outlierDist - a.outlierDist);

          let i:number = 0;

          for (i = 0; i < deadClusters.length && i < outliers.length; i++) {
            // if (outliers[i]) { //need to check with JD
              deadClusters[i].Centroid = outliers[i].outlier.Position;
            // }
          }

          this.Clusters = this.Clusters.concat(deadClusters.slice(0, i));
        }

        const continueOnImprovement = rep < 2 ? true : improvementPerc > 0.01;
        rep++;
        const end = new Date().getTime();
        console.log((end - start) / 1000, rep, dev, converged, continueOnImprovement);
        if (rep < maxRepetitions && dev > targetDeviation && !converged && continueOnImprovement) {
          return this.clusteringAlgo(rep, maxRepetitions, targetDeviation)
        } else {

          //jd: we added 1 to each entry weight to counteract any 0 magnitude calculated weight

          for (let i = 0; i < this.Clusters.length; i++) {
            this.Clusters[i].Weight -= this.Clusters[i].GetCount();
          }

          return of({ rep, improvementPerc })
        }
      }))
  }

  findClosestCluster(featurePositions: ILngLat[], clusterCentroids: ILngLat[]): Observable<ResultResponse> {
    const clientProcessId = WorkQueue.getNextId();
    const message = new FindClosestClusterMessage(clientProcessId, new FindClosestClusterPayload(featurePositions, clusterCentroids))
    this.addProcess(clientProcessId);
    return Observable.create((observer: Observer<WWMessage>) => {
      this.reAssign(message).pipe(
        switchMap(message => {
          if (message.messageType === WWMessageType.ERROR) return throwError("Error at findClosestCluster");
          return of(message)
        }),
      ).subscribe(message => {
        if (message.messageType == WWMessageType.CANCEL) {
          this.removeProcess(clientProcessId);
          observer.complete();
          return;
        }
        observer.next(message);
      }, err => {
        observer.error(err);
      });
    })
  }

  findAllClosestCluster(): Observable<number[]> {
    const clusterCentroids = this.Clusters.map(e => e.Centroid);
    const clone = this.Entries.map((feature, index) => feature.Position).slice(0);
    const number = Math.ceil(clone.length / this.divideProcess);
    const featuresBundle = [];
    while (clone.length) {
      featuresBundle.push(clone.splice(0, number));
    }
    return forkJoin(
      featuresBundle.map((features, i) =>
        this.findClosestCluster(features, clusterCentroids))
    ).pipe(map(arr => {
      return arr.map(e => (<FindClosestClusterResponsePayload>e.data).clusterIndex).reduce((a, b) => [...a, ...b]);
    }))
  }

  calcClusterStats(clusters: ICluster[]): Observable<ResultResponse> {
    const { columnWeight } = this.payload;
    const clientProcessId = WorkQueue.getNextId();
    const message = new CalculateClusterStatsMessage(clientProcessId, new CalculateClusterStatsPayload(clusters, columnWeight ? (feature) => { return feature[columnWeight] ? feature[columnWeight] : 0 } : (feature) => 1))
    this.addProcess(clientProcessId);
    return Observable.create((observer: Observer<WWMessage>) => {
      this.reAssign(message).pipe(
        switchMap(message => {
          if (message.messageType === WWMessageType.ERROR) return throwError("Error at calcClusterStats");
          return of(message)
        }),
      ).subscribe(message => {
        if (message.messageType == WWMessageType.CANCEL) {
          this.removeProcess(clientProcessId);
          observer.complete();
          return;
        }
        observer.next(message);
      }, err => {
        observer.error(err);
      });
    })
  }

  calcAllClusterStats(): Observable<{ clusters: ICluster[], converged: boolean, minWeight: number, maxWeight: number }> {
    const clone = this.Clusters.map(e => e.toICluster()).slice(0);
    const clustersBundle = [];
    const number = Math.ceil(clone.length / this.divideProcess);
    while (clone.length) {
      clustersBundle.push(clone.splice(0, number));
    }
    if (!clustersBundle.length) return throwError("Empty cluster");
    return forkJoin(
      clustersBundle.map((cluster) =>
        this.calcClusterStats(cluster))
    ).pipe(map(arr => {
      const indexs: ICluster[] = [];
      let _converged: boolean = true;
      let _minWeight: number = 99999999999;
      let _maxWeight: number = 0;
      arr.forEach(e => {
        const { clusters, converged, minWeight, maxWeight } = (<CalculteClusterStatsResponsePayload>e.data);
        indexs.push(...clusters);
        _converged = _converged && converged;
        _minWeight = _minWeight < minWeight ? _minWeight : minWeight;
        _maxWeight = _maxWeight > maxWeight ? _maxWeight : maxWeight;
      });
      return {
        clusters: indexs,
        converged: _converged,
        minWeight: _minWeight,
        maxWeight: _maxWeight
      }
    }))
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
    this.currentClientProcessIds.forEach(e => {
      this._parentWorker.deleteProcess(e);
    });
    super.cancelProcess();
  }
}

