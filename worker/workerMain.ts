import { API_BASE_HREF, NAME_OF_WORKER_HANDLING } from '../client/app/shared/global_origin';
import { Subject, Subscription, Observable } from 'rxjs';
import { WWMessage } from './models/messages/message';
import { ClientProcess } from './models/processes/clientProcess';
import { WWMessageType } from './models/messages/messageType';
import { ViewportTilesProcess } from './models/processes/viewportTilesProcess';
import { DeleteOverlayProcess } from './models/processes/deleteOverlayProcess';
import { ResultResponse } from './models/messages/resultResponse';
import { CancelMessage } from './models/messages/cancelMessage';
import { ErrorMessage } from './models/messages/errorMessage';
import { WorkerBase } from './workerBase';
import { PortPayload } from './models/payloads/PortPayload';
import { TileOverlayAbstract } from './models/overlay/tile-overlay-worker';
import { OverlayDataItem } from './models/overlay/overlay-worker.model';
import { RemovePortMessage } from './models/messages/removePortMessage';
import { ViewportTilesRequestPayload } from './models/payloads/ViewportTilesRequestPayload';
import { viewportClusterProcess } from './models/processes/viewportClusterProcess';
import { filter, first } from 'rxjs/operators';
import { InvalidCacheProcess } from './models/processes/invalidCacheProcess';
import { CancelRequestsMessage } from './models/messages/cancelRequestMessage'
import { WorkQueue } from './models/workQueue';
import { CalculateTilesProcess } from './models/processes/calculateTilesProcess';
import { CacheOrRequestProcess } from './models/processes/CacheOrRequestProcess';
import { FilterShapesProcess } from './models/processes/filterShapesProcess';
import { FindClosestClusterProcess } from './models/processes/featureClustererProcess/findClosestClusterProcess';
import { FeatureClustererProcess } from './models/processes/featureClustererProcess/featureClustererProcess';
import { CalculateClusterStatsProcess } from './models/processes/featureClustererProcess/calculateClusterStatsProcess';
export class WorkerMain extends WorkerBase {

    tileOverlays = new Map<string, TileOverlayAbstract<OverlayDataItem>>();
    tileProcessing = new Map<string, number>();
    public loading: Map<number, number> = new Map<number, number>();
    constructor(workerCtx) {
        super(workerCtx);
        WorkQueue.initId(5000);
    }
    assignWork() {
        if (this._workQueue.count === 0) return;
        try {
            const message = this._workQueue.dequeue();
            if (message.messageType === WWMessageType.VIEWPORT_TILES) {
                const { layerId } = (<ViewportTilesRequestPayload>message.data);
                const clientProcessId = this.tileProcessing.get(layerId);
                if (!(clientProcessId == undefined || clientProcessId == null)) {
                    // this.tileOverlays.get(layerId).deleteShapesDeletedTemp();
                    this.deleteProcess(clientProcessId);
                }
            }
          if (this.handleMessageOnWorker(message) && this.workerCtx.Worker) {
            if (this.isMaxWorker()) {
              this._workQueue.enqueue(message);
              return;
            }
            const workerId = this.createWorker(NAME_OF_WORKER_HANDLING, this._cachePort);
            this.handleMessage(message, workerId);
          } else {
            this.handleMessage(message);
          }
        } catch (error) {
            console.error(error);
        }
        this.assignWork();
    }
    handleConfigurePort(message: any) {
        // let pp = <PortPayload>message.data;
        this._cachePort = message.messagePort;
        this._cachePort.start();
        this._cachePort.addEventListener('message', (event: MessageEvent) => {
            const message = <WWMessage>event.data;
            this.cacheListener.next(message);
        })
    }
    handleMessageOnWorker(message: WWMessage) {
        if (message.messageType == WWMessageType.VIEWPORT_TILES) {
            return true;
        }
        return false;
    }
    handleMessage(request: WWMessage, workerId?: number) {
        const cp = this.createProcess(request);
        if (!cp) return;
        cp.workerId = workerId;
        const subscription = cp.start().subscribe(
            message => this.handleResult(message, request.responseResult),
            err => this.handleError(err, cp, request.responseResult));
        subscription.add(() => {
            if (this.processingSubscriptions.has(cp.clientProcessId)) {
                if (!cp.isCanceled)
                    this.handleCancel(cp, request.responseResult);
            }
        })
        this.addProcess(request.clientProcessId, subscription);
    }
    createProcess(message: WWMessage): ClientProcess {
        switch (message.messageType) {
            case WWMessageType.VIEWPORT_TILES: {
                if ((<ViewportTilesRequestPayload>message.data).isClusterOverlay) {
                    return new viewportClusterProcess(this, message);
                } else {
                    return new ViewportTilesProcess(this, message);
                }
            }
            case WWMessageType.DELETEOVERLAY: {
                new DeleteOverlayProcess(this, message).start().subscribe((response) => console.log("Delete Overlay successful"));
                return null;
            }
            case WWMessageType.INVALIDATE_CACHE: {
                new InvalidCacheProcess(this, message).start().subscribe((response) => console.log("pass Invalid Cache to Cache successful"));
                return null;
            }
            default: {
              return this.createProcess_handling(message);
            }
        }
    }
    createProcess_handling(message: WWMessage): ClientProcess {
      switch (message.messageType) {
        case WWMessageType.CALCULATE_TILES: {
          return new CalculateTilesProcess(this, message);
        }
        case WWMessageType.CACHE_OR_REQUEST: {
          return new CacheOrRequestProcess(this, message);
        }
        case WWMessageType.FILTER_SHAPES: {
          return new FilterShapesProcess(this, message);
        }
        case WWMessageType.DO_CLUSTER: {
          return new FeatureClustererProcess(this, message);
        }
        case WWMessageType.FIND_CLOSEST_CLUSTER: {
          return new FindClosestClusterProcess(this, message);
        }
        case WWMessageType.CALC_CLUSTER_STATS: {
          return new CalculateClusterStatsProcess(this, message);
        }
        default: {
          throw "Not Implement"
        }
      }
    }
    handleResult(message: ResultResponse, subject: Subject<WWMessage>) {
        if (subject) {
            subject.next(message);
        }
    }
    handleError(err, cp: ClientProcess, subject: Subject<WWMessage>) {
        console.error(err);
        const message = new ErrorMessage(cp.clientProcessId, err);
        if (subject) {
            subject.next(message);
        }
    }
    handleCancel(cp: ClientProcess, subject: Subject<WWMessage>) {
        if (cp) {
            cp.cancelProcess();
            if (cp.workerId != null) {
                this.terminate(cp.workerId, () => {
                    // console.log("free worker", cp.workerId)
                    if (subject) {
                        const message = new CancelMessage(cp.clientProcessId);
                        subject.next(message);
                    }
                    this.assignWork();
                });
                const removeCachePortMessage = new CancelRequestsMessage(new PortPayload(NAME_OF_WORKER_HANDLING + cp.workerId, `/api${API_BASE_HREF}`));
                this.postCacheMessage(removeCachePortMessage);
            } else {
                if (subject) {
                    const message = new CancelMessage(cp.clientProcessId);
                    subject.next(message);
                }
                this.assignWork();
            }
            console.log("process unsubscribe")
        }
    }
    removeWorker(workerId) {
        const removeCachePortMessage = new RemovePortMessage(new PortPayload(NAME_OF_WORKER_HANDLING + workerId, `/api${API_BASE_HREF}`));
        this.postCacheMessage(removeCachePortMessage);
        super.removeWorker(workerId);
    }
}
