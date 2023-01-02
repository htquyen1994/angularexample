import { ClientProcess } from './clientProcess';
import { Observable, Observer, throwError, of, Subject, merge } from 'rxjs';
import { WWMessage } from '../messages/message';
import { CancelMessage } from '../messages/cancelMessage';
import { WWMessageType } from '../messages/messageType';
import { TileOverlayAbstract } from '../overlay/tile-overlay-worker';
import { OverlayDataItem } from '../overlay/overlay-worker.model';
import { WorkQueue } from '../workQueue';
import { FilterShapesMessage } from '../messages/filterShapesMesssage';
import { FilterShapesPayload } from '../payloads/filterShapePayload';
import { CaculateTilesMessage } from '../messages/calculateTilesMessage';
import { ViewportTilesRequestPayload } from '../payloads/ViewportTilesRequestPayload';
import { tap, filter, switchMap } from 'rxjs/operators';
import { ICacheOrRequestItem, CacheOrRequestPayload } from '../payloads/CacheOrRequestPayload';
import { ResultResponse } from '../messages/resultResponse';
import { CacheOrRequestMessage } from '../messages/cacheOrRequestMessage';
import { WorkerMain } from '../../workerMain';
import { WorkerBase } from '../../../worker/workerBase';
import { CalculateTilesResponsePayload } from '../payloads/responses/calculateTilesResponePayload';
import { CacheResponsePayload } from '../payloads/responses/cacheResponePayload';
import { ErrorType } from '../workItemType';
import { LayerType } from '../../../client/app/shared/enums';
import { TileUtility } from './TileUtility';

export abstract class ViewportProcess extends ClientProcess {
  payload: ViewportTilesRequestPayload;
  tileOverlay: TileOverlayAbstract<OverlayDataItem>;
  isCanceling = false;
  loading = [0, 0];
  updateShapeLoading = [0, 0];
  subject = new Subject<WWMessage>();
  tileDone = new Set<string>();
  tileRequest = new Set<string>();
  totalTilesToRequest = 0;
  abstract checkComplete: Function;
  constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
    super(parentWorker);
    this.clientProcessId = initialMessage.clientProcessId;
    const { filter, zoomLevel, layer, viewport } = <ViewportTilesRequestPayload>initialMessage.data;
    const { zoomConfig } = layer
    if (zoomConfig && zoomConfig[zoomLevel]) {
      const currentZoom = zoomLevel;
      const bufferTile = zoomConfig[zoomLevel];
      const { zoomRender } = bufferTile;
      const bounds = TileUtility.GetTilesBound(viewport, currentZoom, bufferTile);
      this.payload = {
        ...<ViewportTilesRequestPayload>initialMessage.data,
        currentZoom,
        zoomLevel: zoomRender,
        filter: {
          ...filter,
        },
        viewport: bounds
      }
    } else {
      this.payload = <ViewportTilesRequestPayload>initialMessage.data
    }
  }
  start(): Observable<WWMessage> {
    this.tileOverlay = this.getTileOverlay();
    const { filter, layerId, zoomLevel, layer, selectedIds, updateAll, currentTiles, currentZoom, isClusterOverlay } = this.payload;
    console.log({ layerId, zoomLevel, currentZoom });
    this.getCalculateTile().subscribe((message: WWMessage) => {
      const tileIds = (<CalculateTilesResponsePayload>message.data).tileIds;
      const urlEndpoint = 'GetJsonCTile';
      const url = `DataPackage/${urlEndpoint}/${layerId}/Default`;
      let tilesToRequest = [];
      if (zoomLevel < currentZoom) {
        tilesToRequest = this.tileOverlay.updateTiles(tileIds, currentTiles, updateAll, []);
        if (filter.viewportShape || (filter.filters && (Object.keys(filter.filters).length || filter.shape))) {
          tilesToRequest = tileIds;
        }
        this.loading[0] += tilesToRequest.length;
        this.totalTilesToRequest = tilesToRequest.length;
        this.processTileRequest(tilesToRequest, url, zoomLevel, layer, selectedIds, filter, this.loading);
      } else {
        const currentTiles_worker = this.tileOverlay.getTiles().filter(e => !e.isDeleted).map(e => e.id);
        const { requestTiles, neededUpdateTiles, lowPriorityTiles } = TileUtility.GetPriorityTiles(tileIds, currentTiles_worker);
        tilesToRequest = this.tileOverlay.updateTiles([...requestTiles, ...lowPriorityTiles], [], updateAll, neededUpdateTiles);
        if (filter.viewportShape || (filter.filters && (Object.keys(filter.filters).length || filter.shape))) {
          tilesToRequest = tileIds;
        }
        let _lowPriorityTiles = [];
        let _hightPriorityTiles = [];
        if (isClusterOverlay) {
          _hightPriorityTiles = [...tilesToRequest];
        } else {
          if (lowPriorityTiles.length) {
            tilesToRequest.forEach(tileId => {
              if (lowPriorityTiles.includes(tileId)) {
                _lowPriorityTiles.push(tileId);
              } else {
                _hightPriorityTiles.push(tileId);
              }
            })
          } else {
            _hightPriorityTiles = [...tilesToRequest];
          }
        }
        this.totalTilesToRequest += tilesToRequest.length;
        console.log({ tileIds, requestTiles, lowPriorityTiles, neededUpdateTiles, currentTiles_worker, currentTiles, _hightPriorityTiles, _lowPriorityTiles })
        if (_hightPriorityTiles.length) {
          this.loading[0] += _hightPriorityTiles.length;
          this.processTileRequest(_hightPriorityTiles, url, zoomLevel, layer, selectedIds, filter, this.loading);
        }
        if (_lowPriorityTiles.length) {
          this.updateShapeLoading[0] += _lowPriorityTiles.length;
          this.processTileRequest(_lowPriorityTiles, url, zoomLevel, layer, selectedIds, filter, this.updateShapeLoading, true);
        }
      }
    })
    return this.subject.asObservable();
  }

  processTileRequest(tilesToRequest: string[], url: string, zoomLevel: number, layer, selectedIds, filter, loading, isUpdateTiles: boolean = false) {
    let totalTiles = tilesToRequest.length;
    const { source, owner } = layer;
    if (tilesToRequest.length) {
      this.getTilesData(tilesToRequest.map(tileId => {
        this.tileOverlay.addTile(tileId);
        isUpdateTiles ? null : this.tileRequest.add(tileId);
        return {
          tileId: tileId,
          urlPathAndQuery: `${url}?source=${source}&ownerId=${owner}&quadTree=${zoomLevel}/${tileId.toString().split('').join('/')}/`
        }
      })).subscribe((message: ResultResponse) => {
        if (message.messageType === WWMessageType.ERROR) {
          totalTiles -= 1;
          loading[1] += 1;
          this.checkComplete();
        } else {
          const { tileData, tileId } = (<CacheResponsePayload>message.data);
          this.tileDone.add(tileId);
          let remoteTiles = new Set<string>();
          // let remoteFeatureIds = new Set<string>();
          let localFeatures = new Map<string, any>();
          if (tileData && tileData.length) {
            for (let i = 0; i < tileData.length; i++) {
              for (let j = 0; j < tileData[i].remoteTileIds.length; j++) {
                remoteTiles.add(tileData[i].remoteTileIds[j]);
              }
              // for (let j = 0; j < tileData[i].remoteFeatureIds.length; j++) {
              //   remoteFeatureIds.add(tileData[i].remoteFeatureIds[j]);
              // }
              for (let j = 0; j < tileData[i].localFeatures.length; j++) {
                localFeatures.set(tileData[i].localFeatures[j].PeriscopeId.toString(), tileData[i].localFeatures[j]);
              }
            }
          }
          const returnShapes: Observable<WWMessage>[] = [];
          // handle Filter for localFeatures
          loading[0] += 1;
          returnShapes.push(this.getFilteredData(this.tileOverlay, tileId, filter, layer, Array.from(localFeatures.values()), selectedIds));
          // call remoteFeatureRequest
          const handlers: Observable<ResultResponse>[] = [];
          if (remoteTiles.size > 0) {
            const _remoteTiles = Array.from(remoteTiles.values());
            this.tileOverlay.setRemoteTiles(tileId, _remoteTiles);
            const remoteTileFiltered = _remoteTiles.filter(id => {
              const tile = this.tileOverlay.getTile(id);
              if(tile) return tile.isDeleted
              return true
            });
            if (remoteTileFiltered.length) {
              loading[0] += remoteTileFiltered.length;
              const remoteTilesObservable = this.getTilesData(remoteTileFiltered.map(tileId => {
                this.tileOverlay.addTile(tileId);
                isUpdateTiles ? null : this.tileRequest.add(tileId);
                return {
                  tileId: tileId,
                  urlPathAndQuery: `${url}?source=${source}&ownerId=${owner}&quadTree=${zoomLevel}/${tileId.toString().split('').join('/')}/`
                }
              }))
              handlers.push(remoteTilesObservable);
            }
          }
          if (handlers.length) {
            handlers.forEach(e => {
              returnShapes.push(e);
            })
          }
          const handleResponse = (message, loadingAdded) => {
            loading[1] += loadingAdded;
            if (message.messageType === WWMessageType.ERROR) {
              this.checkComplete();
              return;
            }
            const { data } = message;
            if ((<CacheResponsePayload>data).tileData) {
              const { tileData, tileId } = (<CacheResponsePayload>data);
              this.tileDone.add(tileId);
              const remoteTileFeatures = new Map<string, any>();
              let remoteRemoteTiles = new Map<string, string>();
              for (let i = 0; i < tileData.length; i++) {
                for (let j = 0; j < tileData[i].localFeatures.length; j++) {
                  remoteTileFeatures.set(tileData[i].localFeatures[j].PeriscopeId.toString(), tileData[i].localFeatures[j]);
                }
                for (let j = 0; j < tileData[i].remoteTileIds.length; j++) {
                  remoteRemoteTiles.set(tileData[i].remoteTileIds[j], tileData[i].remoteTileIds[j]);
                }
              }
              this.tileOverlay.setRemoteTiles(tileId, Array.from(remoteRemoteTiles.values()));
              loading[0] += Array.from(remoteTileFeatures.values()).length;
              this.getFilteredData(this.tileOverlay, tileId, filter, layer, Array.from(remoteTileFeatures.values()), selectedIds).subscribe(_message => {
                handleResponse(_message, Array.from(remoteTileFeatures.values()).length);
              }, err => handleError(err, Array.from(remoteTileFeatures.values()).length))
            }
            this.checkComplete();
          }
          const handleError = (err, loadingAdded) => {
            loading[1] += loadingAdded;
            this.checkComplete();
            // this.subject.error(err);
          }
          merge(...returnShapes).subscribe(message => {
            handleResponse(message, 1);
          }, err => {
            handleError(err, 1);
          })
        }
      }, err => {
        // this.subject.error(err);
        const { type } = err;
        if (type == ErrorType.UNAUTHORIZED) {
          this.subject.error(err);
        }
        loading[1] += totalTiles;
        this.checkComplete();
      }, () => {
        loading[1] += totalTiles;
        this.checkComplete();
      })
    } else {
      this.checkComplete();
    }
  }

  getTileOverlay() {
    let tileOverlay: TileOverlayAbstract<OverlayDataItem>;
    if ((<WorkerMain>this._parentWorker).tileOverlays.has(this.payload.layerId)) {
      tileOverlay = (<WorkerMain>this._parentWorker).tileOverlays.get(this.payload.layerId);
    } else {
      tileOverlay = new TileOverlayAbstract<OverlayDataItem>(this.payload.layerId);
    }
    (<WorkerMain>this._parentWorker).tileOverlays.set(this.payload.layerId, tileOverlay);
    (<WorkerMain>this._parentWorker).tileProcessing.set(this.payload.layerId, this.clientProcessId);
    return tileOverlay;
  }

  getCalculateTile() {
    const clientProcessId = WorkQueue.getNextId();
    const message = new CaculateTilesMessage(clientProcessId, this.payload);
    if (this.workerId != undefined) {
      this.addChild(clientProcessId);
      return this.postMessage(this.workerId, message).pipe(
        tap(e => e.messageType == WWMessageType.CANCEL ? this.removeChild(clientProcessId) : null),
        filter(e => e.messageType != WWMessageType.CANCEL)
      );
    } else {
      this.addProcess(clientProcessId);
      return this.reAssign(message).pipe(
        tap(e => e.messageType == WWMessageType.CANCEL ? this.removeProcess(clientProcessId) : null),
        filter(e => e.messageType != WWMessageType.CANCEL)
      );
    }
  }

  getTilesData(data: ICacheOrRequestItem[]): Observable<ResultResponse> {
    return Observable.create((observer: Observer<WWMessage>) => {
      const cacheOrRequestPayload = new CacheOrRequestPayload(this.payload.layerId, data, this.payload.updateAll)
      const clientProcessId = WorkQueue.getNextId();
      const cacheOrRequestMessage = new CacheOrRequestMessage(clientProcessId, cacheOrRequestPayload);
      let getTilesData$;
      if (this.workerId != undefined) {
        this.addChild(clientProcessId);
        getTilesData$ = this.postMessage(this.workerId, cacheOrRequestMessage);
      } else {
        this.addProcess(clientProcessId);
        getTilesData$ = this.reAssign(cacheOrRequestMessage);
      }
      getTilesData$.subscribe(message => {
        if (message.messageType == WWMessageType.CANCEL || this.isCanceling) {
          if (this.workerId != undefined) {
            this.removeChild(clientProcessId);
          } else {
            this.removeProcess(clientProcessId);
          }
          observer.complete();
          return;
        } else if (message.messageType == WWMessageType.ERROR) {
          const { status } = message.data;
          if (status && (status == 401 || status == 403)) {
            observer.error({ type: ErrorType.UNAUTHORIZED });
          }
        }
        observer.next(message);
      }, err => {
        observer.error(err);
      })
    })
  }

  getFilteredData(tileOverlay: TileOverlayAbstract<OverlayDataItem>, tileId, _filter, layer, features: any[], selectedIds: string[]): Observable<WWMessage> {
    const clientProcessId = WorkQueue.getNextId()
    const filterShapes_localFeatures = new FilterShapesMessage(
      WorkQueue.getNextId(),
      new FilterShapesPayload(tileId, _filter, layer, features, this.payload.selectedIds)
    );
    if (this.workerId != undefined) {
      this.addChild(clientProcessId);
    } else {
      this.addProcess(clientProcessId);
    }
    const filterProcess$ = this.workerId != undefined ? this.postMessage(this.workerId, filterShapes_localFeatures) : this.reAssign(filterShapes_localFeatures);
    return Observable.create((observer: Observer<WWMessage>) => {
      filterProcess$.pipe(
        switchMap(message => {
          if (message.messageType === WWMessageType.ERROR) return throwError("Error at getFilteredData");
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
        const { shapes, shapesDeleted } = <any>message.data;
        if (shapes && shapes.length) {
          shapes.forEach(shape => {
            const { shapeId } = shape
            if (tileOverlay.hasTile(tileId)) {
              const tile = tileOverlay.getTile(tileId);
              tileOverlay.addShapeFromData(shape, tile);
            } else if ((tileOverlay.getShape(shapeId))) {
              tileOverlay.deleteShape(shapeId, tileId);
            }
          });
        }
        if (shapesDeleted && shapesDeleted.length) {
          shapesDeleted.forEach(shape => {
            const { shapeId } = shape
            if ((tileOverlay.getShape(shapeId))) {
              tileOverlay.deleteShape(shapeId, tileId);
            }
          });
        }
        observer.next(message);
      }, err => {
        observer.error(err);
      });
    })
  }

  pagingShapesReturn(_shapes: any[], papeSize = 500) {
    const shapes = Object.assign([], _shapes);
    const array = [];
    if (shapes.length > 1000) {
      while (shapes.length) {
        array.push(shapes.splice(0, papeSize));
      }
    } else {
      array.push(shapes.splice(0))
    }
    return array;
  }

  cancelProcess() {
    this.isCanceling = true;
    const tileNotDone = Array.from(this.tileRequest.values()).filter(e => !this.tileDone.has(e));
    tileNotDone.forEach(e => this.tileOverlay.deleteTile(e));
    this.childClientProcessIds.forEach(e => {
      const message = new CancelMessage(e);
      this.postMessage(this.workerId, message);
    })
    if ((<WorkerMain>this._parentWorker)) {
      (<WorkerMain>this._parentWorker).tileProcessing.delete(this.payload.layerId);
    }
    // if (this.tileOverlay) {
    //     this.tileOverlay.removeTileNotDone();
    // }
    this.currentClientProcessIds.forEach(e => {
      this._parentWorker.deleteProcess(e);
    })
    console.log("========================= Cancel =====================");
    super.cancelProcess();
  }
}
