import { WWMessage } from './models/messages/message';
import { WWMessageType } from './models/messages/messageType';
import { PortPayload } from './models/payloads/PortPayload';
import { CacheOrRequestPayload } from './models/payloads/CacheOrRequestPayload';
import { Subject, Observable, Observer, Subscription, throwError } from 'rxjs';
import { first, map, catchError } from 'rxjs/operators';
import { ResultResponse } from './models/messages/resultResponse';
import { SharedWorkerBase } from './workerBaseShared';
import { CacheResponsePayload } from './models/payloads/responses/cacheResponePayload';
import { CancelMessage } from './models/messages/cancelMessage';
import { TileOverlayAbstract } from './models/overlay/tile-overlay-worker';
import { OverlayDataItem } from './models/overlay/overlay-worker.model';
import { ErrorMessage } from './models/messages/errorMessage';
import { InvalidCachePayload } from './models/payloads/invalidCachePayload';
import { INVALIDCACHETYPE } from '../client/app/shared/global_origin';
import { ErrorType } from './models/workItemType'


export class CacheWorker extends SharedWorkerBase {
    private workerPorts: Map<string, MessagePort> = new Map<string, MessagePort>();
    tileOverlays = new Map<string, TileOverlayAbstract<OverlayDataItem>>();
    private handlingWorkerSubscriptions: Map<string, Subscription[]> = new Map<string, Subscription[]>();
    public apiBaseHref: string;
    HandleMessage(request: WWMessage, workerId?: string) {
        switch (request.messageType) {
            case WWMessageType.CONFIGURE_PORTS: {
                let pp = <PortPayload>request.data;
                const port = request.messagePort;
                this.workerPorts.set(pp.workerId, port);
                if (!this.apiBaseHref && pp.workerId.startsWith('hubworker')) {
                    this.apiBaseHref = pp.apiBaseHref;
                }
                port.onmessage = (ev: MessageEvent) => this.onWorkerMessage(port, ev, pp.workerId);
                console.log(this.workerPorts)
                break;
            }
            case WWMessageType.REMOVE_PORTS: {
                let pp = <PortPayload>request.data;
                const workerPort = this.workerPorts.get(pp.workerId);
                if (workerPort) {
                    workerPort.close();
                    this.workerPorts.delete(pp.workerId);
                    const subscriptions = this.handlingWorkerSubscriptions.get(pp.workerId);
                    if (subscriptions) {
                        subscriptions.forEach(e => e.unsubscribe());
                        this.handlingWorkerSubscriptions.delete(pp.workerId);
                    }
                }
                console.log(this.workerPorts)
                break;
            }
            case WWMessageType.CANCEL_REQUESTS: {
                let pp = <PortPayload>request.data;
                const subscriptions = this.handlingWorkerSubscriptions.get(pp.workerId);
                if (subscriptions) {
                    subscriptions.forEach(e => e.unsubscribe());
                    this.handlingWorkerSubscriptions.delete(pp.workerId);
                }
                console.log(this.workerPorts)
                break;
            }
            case WWMessageType.INVALIDATE_CACHE: {
                this.invalidateCache(<InvalidCachePayload>request.data);
                break;
            }
            case WWMessageType.CACHE_OR_REQUEST: {
                const subscription = this.cacheOrRequest(request);
                if (this.handlingWorkerSubscriptions.has(workerId)) {
                    const subscriptions = this.handlingWorkerSubscriptions.get(workerId);
                    subscriptions.push(subscription);
                    this.handlingWorkerSubscriptions.set(workerId, subscriptions);
                } else {
                    this.handlingWorkerSubscriptions.set(workerId, [subscription]);
                }
                break;
            }
          case WWMessageType.TERMINATE_WORKER: {
            this.close();
            break;
          }
            default: {
                throw "Unknown message type";
            }
        }
    }

    cacheOrRequest(message: WWMessage) {
        const cacheOrRequestPayload = <CacheOrRequestPayload>message.data;
        const { responsePort, clientProcessId } = message;
        const { data, layerId, updateAll } = cacheOrRequestPayload;
        const urls = data instanceof Array ? data.map(e => e.urlPathAndQuery) : [data.urlPathAndQuery];
        const tileIds = data instanceof Array ? data.map(e => e.tileId) : [data.tileId];
        let terminateRequestSubject: Subject<any> = new Subject<any>();
        // get all data at once
        let count = 0;
        let tileOverlay: TileOverlayAbstract<OverlayDataItem>;
        if (this.tileOverlays.has(layerId)) {
            tileOverlay = this.tileOverlays.get(layerId);
        } else {
            tileOverlay = new TileOverlayAbstract<OverlayDataItem>(layerId);
        }
        const subscriptions = new Subscription();
        console.log(tileIds);
        urls.forEach((url, i) => {
            const subscription = tileOverlay.dataCache.retrieve(`tile_${tileIds[i]}`, () =>
              this.getTiles(`${this.apiBaseHref}${url}`, terminateRequestSubject))
              .pipe(
                first(),
                map(data => ({
                  data,
                  tileId: tileIds[i]
                }))
              ).subscribe(item => {
                count++;
                const { tileId, data } = item;
                console.log(tileId, data);
                const message = new ResultResponse(clientProcessId, new CacheResponsePayload(tileId, [data]));
                responsePort.postMessage(message);
              }, err => {
                count++;
                // console.error(err);
                const {status} = err;
                const message = new ErrorMessage(clientProcessId, { tileId: tileIds[i], status });
                responsePort.postMessage(message);
              });
            subscription.add(() => {
                if (count == urls.length) {
                    const message = new CancelMessage(clientProcessId);
                    responsePort.postMessage(message);
                }
            })
            // subscriptions.add(subscription);
        })
        subscriptions.add(() => {
          terminateRequestSubject.next();
          terminateRequestSubject.complete();
      })
        this.tileOverlays.set(layerId, tileOverlay);
        return subscriptions;
    }

    invalidateCache(payload: InvalidCachePayload) {
        // let keys = msg.data instanceof Array ? msg.data.map(e => e.urlPathAndQuery) : [msg.data.urlPathAndQuery];
        // this.__dataCache.deleteKeys(keys);
        const { type, overlayId, invalidateArray } = payload;
        let tileOverlay: TileOverlayAbstract<OverlayDataItem> = this.tileOverlays.get(overlayId);
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

    onWorkerMessage(mp: MessagePort, ev: MessageEvent, workerId: string): void {
        let message = <WWMessage>ev.data;
        message.responsePort = mp;
        this.HandleMessage(message, workerId);
    };

  private unAuthorizeHandle() {
    const message = new ErrorMessage(-1, { isRedirect: true ,type: ErrorType.UNAUTHORIZED });
    this.messageForAll(message);
  }

  private serverBreakdownHandle() {
    const message = new ErrorMessage(-1, { type: ErrorType.SERVER_BREAKDOWN });
    this.messageForAll(message);
  }

    private getTiles(url, terminateRequestSubject: Subject<any>): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
          let xhr = this.getHttp(url);
          const timeout = setTimeout(() => {
            xhr.send('');
             // const controller = new AbortController();
             if (xhr) {
                 xhr.onload = (res) => {
                     let _res = this.handleErrors(xhr.status, xhr.response);
                     if (res && !_res.isError) {
                         observer.next(_res.response);
                         observer.complete();
                     } else {
                         observer.error(_res);
                     }
                 };
                 xhr.onerror = (error) => {
                   let _res = this.handleErrors(xhr.status, xhr.response);
                     observer.error({
                     status: _res.status,
                     response: `Network Error`
                   });
                 };
                 xhr.onabort = (error) => {
                     observer.error({
                       status: -1,
                       response: `Abort request`
                     });
                 };
                 const subscription$: Subscription = terminateRequestSubject.subscribe(() => {
                   xhr.abort();
                })
             } else {
                 observer.error(`Browser not support XMLHttpRequest`);
                 observer.complete();
             }
          }, 200);
          terminateRequestSubject.subscribe(() => {
            clearTimeout(timeout);
         })
        })
    }
    private getHttp(url) {
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
        // xhr.send('');
        return xhr;
    }
    private handleErrors(status, response) {
        let res: any;
        switch (status) {
          case 200:
            res = {
              isError: false,
              response,
              status,
            }
            break;
          case 401:
          case 403:
            this.unAuthorizeHandle();
            res = {
              isError: true,
              status,
              response
            }
            break;
          case 503:
            this.serverBreakdownHandle();
            res = {
              isError: true,
              status,
              response
            }
            break;
          default:
            res = {
              isError: true,
              status,
              response
            }
            break;
        }
        return res;
    }
}

