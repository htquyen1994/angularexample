import { ResultResponse } from '../messages/resultResponse';
import { ViewportProcess } from './viewportProcess';
import { DoClusterMessage } from '../messages/doClusterMesssage';
import { WorkQueue } from '../workQueue';
import { Observable, Observer, throwError, of } from 'rxjs';
import { WWMessage } from '../messages/message';
import { switchMap } from 'rxjs/operators';
import { WWMessageType } from '../messages/messageType';
import { VoronoiBuilderMessage } from '../messages/voronoiBuilderMessage';
import { VoronoiBuilderPayload } from '../payloads/featureClusterer/voronoiBuilderPayload';
import { ViewportClusterRequestPayload } from '../payloads/viewportClusterRequestPayload';
import { TileUtility } from './TileUtility';
import { WorkerBase } from '../../workerBase';

export class viewportClusterProcess extends ViewportProcess {
  checkComplete: Function;
  constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
    super(parentWorker, initialMessage);
    this.checkComplete = () => this._checkComplete();
  }
  _checkComplete() {
    if (this.loading[1] == this.loading[0]) {
      // let shapesCreated = this.tileOverlay.getPureShapes();
      this.tileOverlay.deleteShapesReturn();
      // let shapesDeleted = this.tileOverlay.getPureShapesDeleted();
      this.tileOverlay.deleteShapesDeletedReturn();
      if (!this.tileOverlay.shapes.size) {
        this.subject.next(new ResultResponse(this.clientProcessId, { loading: this.loading[1] / this.loading[0] }));
        this.subject.complete();
        return;
      }
      const { viewport, isVoronoi, zoomLevel } = this.payload;
      const bounds = TileUtility.GetTilesBound(viewport, zoomLevel, { x: 2, y: 2 }); //bounds for voronoi
      const handler$ = this.buildHandler(this.totalTilesToRequest, isVoronoi, bounds);
      handler$.subscribe(message => {
        const { data } = message;
        console.log(data);
        this.subject.next(new ResultResponse(this.clientProcessId, { loading: this.loading[1] / this.loading[0], clusters: data["clusters"], tileIds: this.tileOverlay.getTiles().map(e => e.id) }));
        this.subject.complete();
      }, err => {
        console.error(err);
        this.subject.error(err);
      })
    } else {
      this.subject.next(new ResultResponse(this.clientProcessId, { loading: this.loading[1] / this.loading[0] }));
    }
  }

  buildHandler(totalTilesToRequest, isVoronoi, viewport): Observable<WWMessage> {
    if (totalTilesToRequest) {
      if (isVoronoi) {
        return this.clusterFeatures().pipe(
          switchMap(message => this.voronoiBuilder(message.data['clusters'], viewport))
        )
      } else {
        return this.clusterFeatures()
      }
    } else if (isVoronoi && (!this.tileOverlay.voronoiCluster)) {
      return this.voronoiBuilder(this.tileOverlay.clusters, viewport);
    }
    return of(new ResultResponse(this.clientProcessId, {
      clusters: !isVoronoi ? this.tileOverlay.clusters : this.tileOverlay.voronoiCluster
    }));
  }

  clusterFeatures(): Observable<WWMessage> {
    const clientProcessId = WorkQueue.getNextId()
    const features = this.tileOverlay.getShapes();
    const clusterMessage = new DoClusterMessage(
      clientProcessId, {
      features: features,
      numInitialClusters: Math.min(features.length * 0.3, 200),
      maxRepetitions: 20,
      targetDeviation: 0.75,
      columnWeight: this.payload.columnName
    });

    return Observable.create((observer: Observer<WWMessage>) => {
      let clusterFeature$: Observable<WWMessage>;
      if (this.workerId != undefined) {
        this.addChild(clientProcessId);
        clusterFeature$ = this.postMessage(this.workerId, clusterMessage);
      } else {
        this.addProcess(clientProcessId);
        clusterFeature$ = this.reAssign(clusterMessage);
      }
      clusterFeature$.pipe(
        switchMap(message => {
          if (message.messageType === WWMessageType.ERROR) return throwError(message.data);
          return of(message)
        }),
      ).subscribe(message => {
        if (message.messageType == WWMessageType.CANCEL || this.isCanceling) {
          if (this.workerId != undefined) {
            this.removeChild(clientProcessId);
          } else {
            this.removeProcess(clientProcessId);
          }
          observer.complete();
          return;
        }
        // if (tileOverlay.hasTile(tileId)) {
        //     const tile = tileOverlay.getTile(tileId);
        //     tile.isDone = true;
        //     console.log("set DONE",tileId);
        // }
        this.tileOverlay.setCluster(message.data['clusters']);
        observer.next(message);
      }, err => {
        observer.error(err);
      });
    })
  }
  voronoiBuilder(clusters, box): Observable<WWMessage> {
    const start = new Date().getTime();
    const clientProcessId = WorkQueue.getNextId()
    const voronoiBuilderMessage = new VoronoiBuilderMessage(clientProcessId, new VoronoiBuilderPayload(clusters, box, (<ViewportClusterRequestPayload>this.payload).ClippingGeometryNames));

    return Observable.create((observer: Observer<WWMessage>) => {
      let clusterFeature$: Observable<WWMessage>;
      if (this.workerId != undefined) {
        this.addChild(clientProcessId);
        clusterFeature$ = this.postMessage(this.workerId, voronoiBuilderMessage);
      } else {
        this.addProcess(clientProcessId);
        clusterFeature$ = this.reAssign(voronoiBuilderMessage);
      }
      clusterFeature$.pipe(
        switchMap(message => {
          if (message.messageType === WWMessageType.ERROR) return throwError(message.data);
          return of(message)
        }),
      ).subscribe(message => {
        if (message.messageType == WWMessageType.CANCEL || this.isCanceling) {
          if (this.workerId != undefined) {
            this.removeChild(clientProcessId);
          } else {
            this.removeProcess(clientProcessId);
          }
          observer.complete();
          return;
        }
        const end = new Date().getTime();
        console.log((end - start) / 1000, message.data['clusters']);
        this.tileOverlay.setVoronoiCluster(message.data['clusters']);
        observer.next(message);
      }, err => {
        observer.error(err);
      });
    })
  }
}

