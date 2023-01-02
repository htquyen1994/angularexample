import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { FindLayer, FindCriteria } from './find.model';
import { HttpService, LayerService } from '../../shared';
import { filter, first, map } from 'rxjs/operators';
import { ReviewModel } from '../shared/models/match-it-review.model';

@Injectable()
export class FindService {

  layers$: BehaviorSubject<FindLayer[]>;

  constructor(
    private httpService: HttpService,
    private layerService: LayerService
  ) { }

  getFindLayers() {
    if (!this.layers$) {
      this.layers$ = new BehaviorSubject<FindLayer[]>(null);
      this.httpService.get('DataPackage/GetFindLayers').subscribe((layers: FindLayer[]) => {
        this.layers$.next(layers);
      })
    }
    return this.layers$.pipe(filter(e => !!e), first());
  }

  previewFind(data: FindCriteria): Observable<ReviewModel> {
    return this.httpService.postJSON(`DataPackage/Find`, data).pipe(
      map((_data: ReviewModel) => {
        const { gridHeader, gridRows } = _data;
        if (gridHeader && gridHeader.length) {
          const index = gridHeader.findIndex(e => e.columnShortId == 'percmatch');
          gridHeader.splice(index, 1);
        }
        if (gridRows && gridRows.length) {
          const percmatchColumnIndex = gridRows[0].columnCells.findIndex(e => e.columnShortId == 'percmatch');
          gridRows.forEach((e, i) => {
            gridRows[i].columnCells.splice(percmatchColumnIndex, 1);
          })
        }
        return { ..._data}
      })
    );
  }
}
