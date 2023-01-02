import { Subject, Subscription, Observable, Observer } from "rxjs";
import { TileOverlayAbstract } from "./shared/models/overlay/tile-overlay-worker";
import { OverlayDataItem } from "./shared/models/overlay/overlay-worker.model";
import { WORKER_ACTION, WORKER_ACTION_UPDATE_OVERLAY, INVALIDCACHETYPE } from "./shared/models/worker-topic.constants";
import { WorkerMessage } from "./shared/models/worker-message.model";
import { LayerDataFunction } from "./shared/models/services/functions";
// import { IJsonTile } from "../../client/app/shared/interfaces/overlay-interfaces";
import { first, debounceTime } from "rxjs/operators";
// import { GeoJsonFeature, IGeometry } from "../../client/app/shared/map-utils/shapes";
import { OverlayService, createShapeReturnType } from "./shared/models/services/overlay.service";
import { LayerType } from "../../client/app/shared/enums/layer-enums";
import { KEY } from "./shared/models/global";

export class AppWorkers {
  workerCtx: any;
  created: Date;
  private terminateSubject: Subject<any>;
  tileOverlays = new Map<string, TileOverlayAbstract<OverlayDataItem>>();
  totalLoading = 0;
  finishedLoading = 0;
  loadingSource = new Subject<any>();
  loading = this.loadingSource.asObservable();
  returnShapeSource = new Subject<any>();
  returnShape = this.returnShapeSource.asObservable();
  debounceTimeReturnShape = 1000;
  debounceTimeDeleteShape = 1000;
  cancelSettimeout = new Subject<any>();
  shapeSettimeout: {
    id: string,
    settimeouts: any[];
  }[] = [];
  progress = 0;
  constructor(workerCtx: any) {
    this.workerCtx = workerCtx;
    this.created = new Date();
    this.terminateSubject = new Subject<any>();
    this.loading.subscribe((progress) => {
      if (Math.abs(this.progress - progress) >= 0.1) {
        this.progress = progress;
        this.messageProgress(progress);
      } else if (progress == 0) {
        this.progress = 0;
        this.messageProgress(progress);
      } else if (progress == 1) {
        this.progress = 0;
        this.messageProgress(progress);
      }
    })
    this.returnShape
      .subscribe(({ id, totalLoading, finishedLoading, tileDone }) => {
        if (tileDone) {
          let tileOverlay: TileOverlayAbstract<OverlayDataItem>;
          if (this.tileOverlays.has(id)) {
            tileOverlay = this.tileOverlays.get(id);
            let shapes = tileOverlay.getPureShapes();
            tileOverlay.deleteShapesReturn();
            let shapesDeleted = tileOverlay.getPureShapesDeleted();
            tileOverlay.deleteShapesDeletedReturn();
            this.messageTileDone(shapes, shapesDeleted, id);
          }
        }
        if (totalLoading == finishedLoading) {
          this.loadingSource.next(this.finishedLoading / this.totalLoading);
        }
      })
    this.cancelSettimeout.subscribe(id => {
      let shapeSettimeoutIndex = this.shapeSettimeout.findIndex(e => e.id == id);
      if (shapeSettimeoutIndex != -1) {
        this.shapeSettimeout[shapeSettimeoutIndex].settimeouts.forEach(e => {
          clearTimeout(e);
          this.addFinishedLoading();
        })
        this.shapeSettimeout[shapeSettimeoutIndex].settimeouts = [];
      }
    })
  }

  workerBroker($event: MessageEvent): void {
    switch ($event.data.action) {
      case WORKER_ACTION.GET:
        this.get($event);
        break;

      case WORKER_ACTION.TERMINATEREQUEST:
        this.terminateSubject.next(null);
        break;

      case WORKER_ACTION.UPDATEOVERLAY:
        this.updateDataCache($event,
          $event.data.data.id,
          $event.data.data.tileIds,
          $event.data.data.zoom,
          $event.data.data.filter,
          $event.data.data.layer,
          $event.data.data.updateAll,
          $event.data.data.api_base_href,
          $event.data.data.selectedIds,
          $event.data.data.isClusterOverlay)
        break;

      case WORKER_ACTION.DELETEOVERLAY:
        this.messageUnsubcribe($event.data.data.id);
        this.deleteOverlay($event.data.data.id);
        break;

      case WORKER_ACTION.INVALIDATEANDUPDATE:
        this.invalidateAndUpdate(
          $event.data.data.type,
          $event.data.data.id,
          $event.data.data.invalidateArray
        )
        break;

      case WORKER_ACTION.CHECKRUNNING:
        this.messageCheckRunning();
        break;
      default:
        console.log('not implement yet')
        break;
    }
  }

  private get(event) {
    fetch(event.data.data.url)
      .then(response => response.json())
      .then(response => {
        this.returnWorkResults({
          action: event.data.action,
          key: event.data.key,
          data: response
        });
      }, err => {
        let data = err;
        if (err.name == 'AbortError') {
          data = {
            name: 'AbortError',
            isError: true
          };
        }
        this.returnWorkResults({
          action: event.data.action,
          key: event.data.key,
          data: data,
          isError: true
        });
      });
  }

  invalidateAndUpdate(type: INVALIDCACHETYPE, overlayId: string, invalidateArray: string[]) {
    let tileOverlay: TileOverlayAbstract<OverlayDataItem> = this.tileOverlays.get(overlayId)
    if (!tileOverlay) {
      return;
    }
    switch (type) {
      case INVALIDCACHETYPE.Tiles:
        invalidateArray.forEach((key) => {
          tileOverlay.deleteTile(key);
          tileOverlay.dataCache.deleteKeys([`tile_${key}`]);
        });
        break;
      case INVALIDCACHETYPE.FeatureIds:
        invalidateArray.forEach((featId) => {
          for (let zoom = 0; zoom < 20; zoom++) {
            const cacheKey = `feature_${zoom}_${featId}`;

            const feat = tileOverlay.dataCache.retrieveDirect<any>(cacheKey);
            tileOverlay.dataCache.deleteKeys([cacheKey]);
            if ((feat)) {
              tileOverlay.deleteShape(feat.shapeId);
            }
          }
        });
        break;
      case INVALIDCACHETYPE.Prefixes:
        invalidateArray.forEach((key) => {
          tileOverlay.dataCache.deleteKeys([`tile_${key}`]);
          tileOverlay.deleteTile(tileOverlay.getTile(key));
        });

        const prefixMap: { [len: number]: string[] } = {};

        for (let i = 1; i < 26; i++) {
          prefixMap[i] = [];
        }

        invalidateArray.forEach(a => {
          const len = a.length;

          prefixMap[len].push(a);
        });

        const storage: string[] = [];

        tileOverlay.dataCache.visitKeys(key => {
          if (key.startsWith('feature')) {
            return;
          }

          for (let i = 0; i < key.length; i++) {
            if ((prefixMap[i]) && prefixMap[i].some(pf => key.startsWith(`tile_${pf}`))) {
              storage.push(key);
              return;
            }
          }
        });

        storage.forEach((cacheKey) => {
          tileOverlay.deleteTile(tileOverlay.getTile(cacheKey));
        });
        tileOverlay.dataCache.deleteKeys(storage.map(a => `tile_${a}`));
        break;
      case INVALIDCACHETYPE.All:
        tileOverlay.dataCache.clear();
        break;
      default:
        break;
    }
  }

  private returnWorkResults(message: WorkerMessage): void {
    this.workerCtx.postMessage(message);
  }

  private updateDataCache(
    event,
    id: string,
    tileIdsBound: string[],
    zoom: number,
    filter: any,
    layer: any,
    updateAll: boolean,
    api_base_href: string,
    selectedIds: string[],
    isClusterOverlay: boolean) {
    this.cancelSettimeout.next(id);
    this.totalLoading = this.totalLoading - this.finishedLoading;
    this.finishedLoading = 0;
    let tileOverlay: TileOverlayAbstract<OverlayDataItem>;

    if (this.tileOverlays.has(id)) {
      tileOverlay = this.tileOverlays.get(id);
    } else {
      tileOverlay = new TileOverlayAbstract<OverlayDataItem>(id);
    }
    let shapeSetTimeOutIndex = this.shapeSettimeout.findIndex(e => e.id == id);
    if (shapeSetTimeOutIndex == -1) {
      shapeSetTimeOutIndex = this.shapeSettimeout.push({
        id: id,
        settimeouts: []
      }) - 1;
    }

    if (updateAll) {
      tileOverlay.clear();
    }

    let _totalLoading = 0;
    let _finishedLoading = 0;
    const remoteShapes: string[] = [];
    const remoteTiles: string[] = [];
    const type = layer.type;
    const urlEndpoint = type === LayerType.POINT ? 'GetJsonPointTile' : type === LayerType.POLYGON && isClusterOverlay ? 'GetJsonCTile' : 'GetJsonTile';
    const url = `${api_base_href}DataPackage/${urlEndpoint}/${layer.id}/Default`;
    const tileFilter = LayerDataFunction.getPredicate(filter, layer);
    const featureFilter = LayerDataFunction.createFeatureFilter(tileFilter, layer.schema);
    const tileIds = tileOverlay.updateTiles(tileIdsBound, updateAll);
    this.addTotalLoading(tileIds.length);
    _totalLoading += tileIds.length;


    tileIds.forEach(tileId => {
      let tile = tileOverlay.addTile(tileId);
      let terminateRequestSubject: Subject<any> = new Subject<any>();
      const subscriptionTile = tileOverlay.dataCache.retrieve<any>(
        `tile_${tileId}`, () => this.getTiles(`${url}?quadTree=${zoom}/${tileId.toString().split('').join('/')}/`, terminateRequestSubject))
        .pipe(first())
        .subscribe((item: any) => {

          _finishedLoading++;
          this.addTotalLoading(item.localFeatures ? item.localFeatures.length : 0);
          _totalLoading += item.localFeatures ? item.localFeatures.length : 0;

          item.localFeatures.forEach((shape: any, _index) => {

            let shapeSettimeout = setTimeout(() => {
              shape.shapeId = shape.PeriscopeId.toString();

              let subscriptionShape = OverlayService.createShape(tileOverlay, tile, shape, featureFilter, selectedIds)
                .subscribe(res => {

                });

              subscriptionShape.add(() => {
                this.addFinishedLoading();
                _finishedLoading++;
                let index = this.shapeSettimeout[shapeSetTimeOutIndex].settimeouts.findIndex(e => e == shapeSettimeout)
                this.shapeSettimeout[shapeSetTimeOutIndex].settimeouts.splice(index, 1);
                this.createShapes(_totalLoading, _finishedLoading, tileOverlay.id, _index == item.localFeatures.length - 1);
              })

              tile.subscriptions.add(subscriptionShape);

            }, 0);

            this.shapeSettimeout[shapeSetTimeOutIndex].settimeouts.push(shapeSettimeout);

          });



          remoteShapes.forEach(id => tileOverlay.addShapeToTile(id, tileOverlay.getShape(id), tile));
          let remoteFeatureIdsFitered = item.remoteFeatureIds.filter(id => !remoteShapes.includes(id));
          this.addTotalLoading(remoteFeatureIdsFitered.length);
          _totalLoading += remoteFeatureIdsFitered.length;
          let remoteFeatureTotalLoading = remoteFeatureIdsFitered.length;
          let remoteFeatureFinishedLoading = 0;




          remoteFeatureIdsFitered.forEach((id: any, __index) => {
            remoteShapes.push(id);
            let _terminateRequestSubject: Subject<any> = new Subject<any>();
            const subscriptionFeature = tileOverlay.dataCache.retrieve<any>(
              `feature_${zoom}_${id}`,() => this.getTiles(`${url}?quadTree=${zoom}/${id}.jsonfeature`, _terminateRequestSubject))
              .pipe(first())
              .subscribe(
                (shape: any) => {
                  if (shape) {

                    this.addTotalLoading();

                    let _shapeSettimeout = setTimeout(() => {
                      shape.shapeId = shape.PeriscopeId.toString();

                      let subscriptionShape = OverlayService.createShape(tileOverlay, tile, shape, featureFilter, selectedIds)
                        .subscribe(res => {

                        });

                      subscriptionShape.add(() => {
                        this.addFinishedLoading();
                        _finishedLoading++;
                        remoteFeatureFinishedLoading++;
                        let index = this.shapeSettimeout[shapeSetTimeOutIndex].settimeouts.findIndex(e => e == _shapeSettimeout)
                        this.shapeSettimeout[shapeSetTimeOutIndex].settimeouts.splice(index, 1);
                        this.createShapes(_totalLoading, _finishedLoading, tileOverlay.id, remoteFeatureFinishedLoading == remoteFeatureTotalLoading);
                      })

                      tile.subscriptions.add(subscriptionShape);

                    }, 0);

                    this.shapeSettimeout[shapeSetTimeOutIndex].settimeouts.push(_shapeSettimeout);
                  }
                });

            subscriptionFeature.add(() => {
              _terminateRequestSubject.next();
              _terminateRequestSubject.complete();
              this.addFinishedLoading();
              this.createShapes(_totalLoading, _finishedLoading, tileOverlay.id);
            });

            tile.subscriptions.add(subscriptionFeature);

          });
        })



      subscriptionTile.add(() => {
        terminateRequestSubject.next();
        terminateRequestSubject.complete();
        this.addFinishedLoading();
        this.createShapes(_totalLoading, _finishedLoading, tileOverlay.id);
      });
      tile.subscriptions.add(subscriptionTile);
    })
    this.tileOverlays.set(id, tileOverlay);
  }

  private addTotalLoading(num?: number) {
    if (num != undefined) {
      this.totalLoading += num;
    } else {
      this.totalLoading++;
    }
    this.loadingSource.next(this.finishedLoading / this.totalLoading);
  }

  private addFinishedLoading(num?: number) {
    if (num != undefined) {
      this.finishedLoading += num;
    } else {
      this.finishedLoading++;
    }
    this.loadingSource.next(this.finishedLoading / this.totalLoading);
  }

  private createShapes(totalLoading, finishedLoading, id: string, tileDone?) {
    this.returnShapeSource.next({ id: id, totalLoading: totalLoading, finishedLoading: finishedLoading, tileDone: tileDone });
  }

  private getTiles(url, terminateRequestSubject: Subject<any>): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      // const controller = new AbortController();
      let xhr = this.getHttp(url);
      if (xhr) {
        const subscription$: Subscription = terminateRequestSubject.subscribe(() => {
          xhr.abort();
        })
        xhr.onload = (res) => {
          let _res = this.handleErrors(xhr.status, xhr.response);
          if (res && !_res.isError) {
            observer.next(_res.response);
            observer.complete();
            subscription$.unsubscribe();
          } else {
            observer.error(_res);
            observer.complete();
            subscription$.unsubscribe();
          }
        };
        xhr.onerror = (error) => {
          observer.error(`Network Error`);
          observer.complete();
          subscription$.unsubscribe();
        };
        xhr.onabort = (error) => {
          observer.error(`Abort request`);
          observer.complete();
          subscription$.unsubscribe();
        };
      } else {
        observer.error(`Browser not support XMLHttpRequest`);
        observer.complete();
      }
    })
  }

  getHttp(url) {
    let xhr: XMLHttpRequest;
    if (typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
    else {
      return null;
    }
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Suppress-Redirect', 'True')
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.responseType = 'json';
    xhr.withCredentials = true;
    xhr.send('');
    return xhr;
  }

  handleErrors(status, response) {
    let res: any;
    switch (status) {
      case 200:
        res = {
          isError: false,
          response: response,
          status: status,
        }
        break;
      case 401:
      case 403:
        this.messageErrorAuthorized();
      default:
        res = {
          isError: true,
          status: status,
          response: response
        }
        break;
    }
    return res;
  }

  deleteOverlay(id: string) {
    this.cancelSettimeout.next(id);
    let tileOverlay: TileOverlayAbstract<OverlayDataItem>;
    if (this.tileOverlays.has(id)) {
      tileOverlay = this.tileOverlays.get(id);
      tileOverlay.clear();
    }
  }

  messageUnsubcribe(id) {
    this.returnWorkResults({
      action: WORKER_ACTION.UPDATEOVERLAY,
      key: KEY.UPDATEOVERLAY + id,
      data: {
        type: WORKER_ACTION_UPDATE_OVERLAY.UNSUBCRIBE,
      }
    })
  }

  messageTileDone(shapes, shapesDeleted, id) {
    this.returnWorkResults({
      action: WORKER_ACTION.UPDATEOVERLAY,
      key: KEY.UPDATEOVERLAY + id,
      data: {
        type: WORKER_ACTION_UPDATE_OVERLAY.tileDONE,
        data: {
          shapesCreated: shapes,
          shapesDeleted: shapesDeleted,
        }
      }
    })
  }

  messageProgress(progress) {
    this.returnWorkResults({
      action: WORKER_ACTION.PROGRESSLOADING,
      data: {
        type: WORKER_ACTION_UPDATE_OVERLAY.PROGRESS,
        data: progress
      }
    })
  }
  messageCheckRunning() {
    this.returnWorkResults({
      action: WORKER_ACTION.CHECKRUNNING,
    })
  }
  messageErrorAuthorized() {
    this.returnWorkResults({
      action: WORKER_ACTION.ERROR_UNAUTHORIZED,
    })
  }
}
