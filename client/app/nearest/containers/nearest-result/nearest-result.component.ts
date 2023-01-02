import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ILayer, IFilter } from '@client/app/shared/interfaces';
import { NearestStoreService } from '../../services';
import { map } from 'rxjs/operators';
import { OVERLAY_TYPE } from '@client/app/shared/enums';
import { AccountService, SelectionService } from '@client/app/shared';

@Component({
  selector: 'ps-nearest-result',
  templateUrl: './nearest-result.component.html',
  styleUrls: ['./nearest-result.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NearestResultComponent implements OnInit {
  public layer$: Observable<ILayer>;
  public filter$: Observable<IFilter>;
  public results$: Observable<any[]>;
  public loading$: Observable<boolean>;
  public downloading$: Observable<boolean>;
  public canDownload$: Observable<boolean>;
  public columns$: Observable<{ header: string, id: string, align: string, type: string, isPercentage: boolean, formatPipe: string, format: string }[]>
  public isMetric$: Observable<boolean>;
  constructor(
    private _nearestStoreService: NearestStoreService,
    private _accountService: AccountService,
    private _selectionService: SelectionService
  ) { }

  ngOnInit(): void {
    this.results$ = this._nearestStoreService.results$;
    this.loading$ = this._nearestStoreService.loading$;
    this.isMetric$ = this._accountService.account.pipe(map(e => e.isMetric));
    this.downloading$ = this._nearestStoreService.downloading$;
    this.canDownload$ = this._nearestStoreService.results$.pipe(map(e => !!(e && e.length)));
    this.columns$ = this._nearestStoreService.columns$;
  }

  ngOnDestroy(): void {
    this._nearestStoreService.clearResults();
  }

  onDownload() {
    this._nearestStoreService.download();
  }

  onSelected(item) {
   this
    this.changeSelection(item, true);
    this.onZoomToFeature(item);
  }

  onUnSelected(item) {
    this.changeSelection(item, false);
  }

  changeSelection(item, value: boolean) {
    const { _LABEL } = item;
    this._selectionService.clearLayerSelections(OVERLAY_TYPE.NEAREST);
    this._selectionService.changeSelection({ isAdd: value, shapeId: _LABEL, overlayId: OVERLAY_TYPE.NEAREST });
  }

  onZoomToFeature(item) {
    const { _LABEL } = item;
    this._nearestStoreService.zoomToFeature(_LABEL);
  }

  onZoomAll() {
    this._nearestStoreService.zoomAll();
  }
}
