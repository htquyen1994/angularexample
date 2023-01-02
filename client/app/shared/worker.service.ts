import { Injectable } from '@angular/core';
import { Subject, Observable, Subscription, fromEvent, of, throwError, Observer, queueScheduler, animationFrameScheduler, asyncScheduler } from 'rxjs';
import { WorkerMessage } from '../../../client_webworker/app-workers/shared/models/worker-message.model';
import { environment } from '../../environments/environment';
import { WORKER_ACTION } from '../../../client_webworker/app-workers/shared/models/worker-topic.constants';
import { filter, first, map, switchMap, observeOn, catchError } from 'rxjs/operators';
import { IBoundingBox } from '../iface/IBoundingBox';
import { IFilter, EPerformanceLevel } from './interfaces';
import { KEY } from 'src/client_webworker/app-workers/shared/models/global';
import { WorkerHub } from '../../../worker/workerHub';
import { WorkItemType, ErrorType } from '../../../worker/models/WorkItemType';
import * as _ from 'lodash';
import { INVALIDCACHETYPE, MAX_NUMBER_WORKERS, MAX_NUMBER_WORKERS_HANDLING } from './global_origin';
import { WWMessageType } from 'src/worker/models/messages/messageType';
import { ActionMessageService } from './action-message.service';
import { decorateError } from './http.util';
import { AccountService } from './account.service';
import { SystemBreakdownService } from './services/system-breakdown.service';
@Injectable()
export class WorkerService {
  public readonly workerPath = `${environment.baseUrl}/assets/workers/main1.js`;
  overlayProcessMapping = new Map<string, number>()
  private workerHub: WorkerHub;
  get isInit() {
    return !!this.workerHub;
  }
  constructor(
    public actionMessageService: ActionMessageService,
    public systemBreakdownService: SystemBreakdownService
  ) {
  }

  workerNewInnit(success: Function, retry?: number) {
    if (!this.workerHub) {
      this.workerHub = new WorkerHub(() => {
      }, (_error) => {
        const { type, error } = _error;
        switch (type) {
          case ErrorType.WORKER_INIT:
            this.workerHub = null;
            if (retry > 2) {
              console.error("Can't not create worker!")
              this.actionMessageService.sendError("Can't not create worker!");
            } else {
              setTimeout(() => {
                this.workerNewInnit(success, retry++);
              }, 2000);
            }
            break;
          case ErrorType.COMMON:
            this.actionMessageService.sendError(decorateError(error).error.message);
            break;
          case ErrorType.UNAUTHORIZED:
            this.workerHub.closeSharedWorker();
            this.systemBreakdownService.reloadBrowser();
            break;
          case ErrorType.SERVER_BREAKDOWN:
            if(!this.systemBreakdownService.isServerDown){
                this.systemBreakdownService.checkServer();
            }
          default:
            break;
        }
      });
      if (this.workerHub) success();
    }
  }

  configWorker() {

    //let target = Math.max(1, Math.round(Math.pow(navigator.hardwareConcurrency, 0.5)));

    let target = Math.pow(navigator.hardwareConcurrency, 0.5);

    let max_number_workers = Math.max(1, Math.floor(target));
    let max_number_workers_handling = Math.ceil(target);

    this.workerHub.assignWorkItem({
      workItemType: WorkItemType.CONFIG_WORKER, data: {
        max_number_workers,
        max_number_workers_handling
      }
    });
  }

  updateOverlay(data: {
    layerId: string;
    viewport: IBoundingBox;
    filter: IFilter;
    zoomLevel: number;
    layer: any;
    isClusterOverlay: boolean;
    selectedIds: string[];
    updateAll: boolean;
    currentTiles: string[];
    isVoronoi?: boolean;
    viewPortChanged?: boolean;
    columnName?: string,
    ClippingGeometryNames: string[]
  }): Observable<any> {
    let _layer = _.cloneDeep(data.layer);
    if (_layer && _layer.schema && _layer.schema.FieldGroups) {
      _layer.schema.FieldGroups = _layer.schema.FieldGroups.map(e => { // fix Converting circular structure to JSON
        return {
          Description: e.Description,
          HasTotal: e.HasTotal,
          Index: e.Index,
          Name: e.Name
        }
      })
    }
    if (_layer && _layer.columnGroups) {
      _layer.columnGroups = _layer.columnGroups.map(e => { // fix Converting circular structure to JSON
        return {
          Description: e.Description,
          HasTotal: e.HasTotal,
          Index: e.Index,
          Name: e.Name
        }
      })
    }
    if (_layer && _layer.columns) {
      _layer.columns = _layer.columns.map(e => {// fix Converting circular structure to JSON
        return {
          ...e,
          options: undefined,
          value: undefined
        }
      })
    }
    const clientProcessId = this.workerHub.assignWorkItem({
      workItemType: WorkItemType.UPDATEOVERLAY, data: {
        ...data,
        layer: JSON.parse(JSON.stringify(_layer)),
      }
    });
    this.overlayProcessMapping.set(data.layerId, clientProcessId);
    return this.workerHub.clientMessage$
      .pipe(
        filter(x => x.clientProcessId === clientProcessId),
        switchMap(x => x.messageType == WWMessageType.ERROR ? throwError(`Error at ${x.data && x.data["tileId"] ? x.data["tileId"] : 'UpdateOverlay'}`) : of(x)),
        map(x => x.data),
        observeOn(asyncScheduler)
      )
  }

  deleteOverlay(layerId: string) {
    const clientProcessId = this.overlayProcessMapping.get(layerId);
    this.workerHub.assignWorkItem({
      workItemType: WorkItemType.CANCELOVERLAY, data: clientProcessId
    })
    this.workerHub.assignWorkItem({
      workItemType: WorkItemType.DELETEOVERLAY, data: { layerId, cancelClientProcessId: clientProcessId }
    })
  }

  cancelOverlay(layerId) {
    const clientProcessId = this.overlayProcessMapping.get(layerId);
    if (clientProcessId == undefined) return;
    this.workerHub.assignWorkItem({
      workItemType: WorkItemType.CANCELOVERLAY, data: clientProcessId
    })
  }

  invalidateAndUpdate(type: INVALIDCACHETYPE, overlayId: string, invalidateArray: string[]) {
    this.workerHub.assignWorkItem({
      workItemType: WorkItemType.INVALIDCACHE, data: {
        type,
        overlayId,
        invalidateArray
      }
    })
  }

  // handleErrorAuthorized() {
  //   return this.workerUpdate$
  //     .pipe(
  //       filter(x => x.action === WORKER_ACTION.ERROR_UNAUTHORIZED),
  //       first()
  //     ).subscribe(() => {
  //       this.destroyWorker();
  //       window.location.href = `${window.location.href}?${Math.random()}`;
  //     })
  // }
}
