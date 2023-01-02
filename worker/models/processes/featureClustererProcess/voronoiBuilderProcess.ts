import { WorkerBase } from "../../../workerBase";
import { Observable, Observer, Subject, forkJoin, throwError, of } from "rxjs";
import { FindClosestClusterPayload, FindClosestClusterResponsePayload } from "../../payloads/featureClusterer/findClosestClusterPayload";
import { WWMessage } from "../../messages/message";
import { ClientProcess } from "../clientProcess";
import { ResultResponse } from "../../messages/resultResponse";
import { LngLat } from "../../../../client/app/shared/featureclusterer/featureclusterer";
import { WorkQueue } from "../../workQueue";
import { FindClosestClusterMessage } from "../../messages/doClusterMesssage";
import { WWMessageType } from "../../messages/messageType";
import { tap, switchMap, map } from "rxjs/operators";
import { CancelMessage } from "../../messages/cancelMessage";
import { VoronoiBuilderPayload, ClippingVoronoiClusterPayload, ClippingVoronoiClusterResponsePayload } from "../../payloads/featureClusterer/voronoiBuilderPayload";
import { VoronoiBuilderMessage, CLippingVoronoiClusterMessage } from "../../messages/voronoiBuilderMessage";
import { VoronoiBuilder } from "../../../../client/app/shared/voronoi/VoronoiBuilder";
import { IFeature, IPolygon } from "../../../../client/app/shared/map-utils/shapes-pure";
import { pagingShapes } from "../../../../client/app/shared/global_origin";
import { IBoundingBox } from "../../../../client/app/iface/IBoundingBox";

export class VoronoiBuilderProcess extends ClientProcess {
  private payload: VoronoiBuilderPayload;

  subject = new Subject<any>();
  private divideProcess = 1;
  private timeout: any;
  start(): Observable<WWMessage> {
    if (this.workerId != undefined) {
      return this.handleInAnotherWorker();
    } else {
      this.timeout = setTimeout(() => {
        try {
          const { box, clusters } = this.payload;
          const voronoiBuilder = new VoronoiBuilder(clusters, box);
          const features = voronoiBuilder.calculate();
          const clippingArea$ = this.voronoiClippingProcess(this.payload.clippingGeometryNames, features, box);
          clippingArea$.subscribe(polygons => {
            const result = new ResultResponse(this.clientProcessId, { clusters: polygons });
            this.subject.next(result);
            this.subject.complete();
          }, err => {
            this.subject.error(err);
          })
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
    this.payload = <VoronoiBuilderPayload>initialMessage.data;
    this.divideProcess = this._parentWorker.max_number_workers + 1;
  }

  handleInAnotherWorker() {
    const clientProcessId = WorkQueue.getNextId();
    const findClosestClusterMessage = new VoronoiBuilderMessage(clientProcessId, this.payload);
    this.addChild(clientProcessId);
    this.postMessage(this.workerId, findClosestClusterMessage).pipe(
      tap(e => e.messageType == WWMessageType.CANCEL ? this.removeChild(clientProcessId) : null),
    ).subscribe(message => {
      if (message.messageType === WWMessageType.ERROR) {
        this.subject.error("Error at handleInAnotherWorker VoronoiBuilderMessage");
      } else {
        const { data } = message;
        const result = new ResultResponse(this.clientProcessId, data);
        this.subject.next(result);
        this.subject.complete();
      }
    })
    return this.subject.asObservable();
  }

  voronoiClippingProcess(clippingGeometryNames : string[], voronoiClusterFeature: IFeature<IPolygon>[], box:IBoundingBox) {
    const clone = voronoiClusterFeature.slice(0);
    const number = Math.ceil(clone.length / this.divideProcess);
    const featuresBundle = [];
    while (clone.length) {
      featuresBundle.push(clone.splice(0, number));
    }
    return forkJoin(
      featuresBundle.map((features, i) =>
        this.voronoiClipping(clippingGeometryNames, features, box))
    ).pipe(map(arr => {
      let _minDensity: number = 1E26;
      let _maxDensity: number = 0;
      arr.forEach(e => {
        const { maxDensity, minDensity } = (<ClippingVoronoiClusterResponsePayload>e.data);
        _minDensity = _minDensity < minDensity ? _minDensity : minDensity;
        _maxDensity = _maxDensity > maxDensity ? _maxDensity : maxDensity;
      });
      const difDensity = _maxDensity - _minDensity;
      return arr.map(e =>
        (<ClippingVoronoiClusterResponsePayload>e.data).features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            minDensity: _minDensity,
            maxDensity: _maxDensity,
            ratioScale: (feature.properties.density - _minDensity) / difDensity,
          }
        }))
      ).reduce((a, b) => [...a, ...b]);
    }))
  }

  voronoiClipping(clippingGeometryNames : string[], voronoiClusterFeature: IFeature<IPolygon>[], box:IBoundingBox): Observable<WWMessage> {
    const clientProcessId = WorkQueue.getNextId();
    const message = new CLippingVoronoiClusterMessage(clientProcessId,
      new ClippingVoronoiClusterPayload(clippingGeometryNames, voronoiClusterFeature, box))
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

