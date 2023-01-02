import { Injectable } from '@angular/core';
import { Observable, Observer, Subscription, throwError as observableThrowError } from 'rxjs';
import { WorkerService } from '../worker.service';
import { WORKER_ACTION, INVALIDCACHETYPE } from '../../../../client_webworker/app-workers/shared/models/worker-topic.constants';
import { API_BASE_HREF } from '../global';
import { filter, tap, map } from 'rxjs/operators';
import { IFilter, ILayer } from '../interfaces';
import { KEY } from '../../../../client_webworker/app-workers/shared/models/global';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class WorkerMapProcessingService {

  constructor(private workerService: WorkerService) { }

  // updateOverlay(id: string, 
  //   tileIds: string[], 
  //   zoom: number, 
  //   ifilter: IFilter, 
  //   layer: ILayer, 
  //   updateAll: boolean, 
  //   selectedIds?: string[], 
  //   isClusterOverlay?: boolean) {
  //   try {
  //     const key = KEY.UPDATEOVERLAY + id;
  //     let _layer = _.cloneDeep(layer);
  //     if (_layer && _layer.schema && _layer.schema.FieldGroups) {
  //       _layer.schema.FieldGroups = _layer.schema.FieldGroups.map(e => { // fix Converting circular structure to JSON
  //         return {
  //           Description: e.Description,
  //           HasTotal: e.HasTotal,
  //           Index: e.Index,
  //           Name: e.Name
  //         }
  //       })
  //     }
  //     if (_layer && _layer.columnGroups) {
  //       _layer.columnGroups = _layer.columnGroups.map(e => { // fix Converting circular structure to JSON
  //         return {
  //           Description: e.Description,
  //           HasTotal: e.HasTotal,
  //           Index: e.Index,
  //           Name: e.Name
  //         }
  //       })
  //     }
  //     if (_layer && _layer.columns) {
  //       _layer.columns = _layer.columns.map(e => {// fix Converting circular structure to JSON
  //         return {
  //           ...e,
  //           options: undefined,
  //           value: undefined
  //         }
  //       })
  //     }
  //     this.workerService.doWork({
  //       action: WORKER_ACTION.UPDATEOVERLAY,
  //       key,
  //       data: {
  //         id,
  //         tileIds,
  //         api_base_href: `/api${API_BASE_HREF}`,
  //         zoom,
  //         filter: ifilter,
  //         layer: JSON.parse(JSON.stringify(_layer)),
  //         updateAll,
  //         selectedIds,
  //         isClusterOverlay
  //       }
  //     });
  //     return this.workerService.workerUpdate$
  //       .pipe(
  //         filter(x => x.key === key),
  //         map(x => x.data)
  //       )
  //   } catch (error) {
  //     return observableThrowError(error);
  //   }
  // }

  // deleteOverlay(id: string) {
  //   const key = KEY.DELETEOVERLAY;
  //   this.workerService.doWork({
  //     action: WORKER_ACTION.DELETEOVERLAY,
  //     key,
  //     data: {
  //       id: id,
  //     }
  //   });
  // }

  // terminateRequest() {
  //   this.workerService.terminateRequest();
  // }

  // loadingListen() {
  //   return this.workerService.workerUpdate$
  //     .pipe(
  //       filter(x => x.action === WORKER_ACTION.PROGRESSLOADING),
  //       map(x => x.data)
  //     )
  // }

  // invalidateAndUpdate(type: INVALIDCACHETYPE, overlayId: string, invalidateArray: string[]) {
  //   this.workerService.doWork({
  //     action: WORKER_ACTION.INVALIDATEANDUPDATE,
  //     data: {
  //       type: type,
  //       id: overlayId,
  //       invalidateArray: invalidateArray
  //     }
  //   });
  // }
}
