import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { cloneDeep } from 'lodash';

import { InsightStoreService } from '../../services';
import { AnalysisStoreService } from '../../../analysis/services';
import { map, shareReplay, takeUntil, withLatestFrom } from 'rxjs/operators';
import { IInsightPolygon } from '../../interfaces';
import { LayerGroupService, OverlayShape, DrawingOverlay, OverlayService, ActionMessageService, MAXSLIDERSUSED, LayerStyleService, CUSTOM_NEON_GRADIENT_STYLE, AppInsightsService, AccountService } from '@client/app/shared';
import { EStateInsight } from '@client/app/shared/enums';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { ReviewModel } from '@client/app/resultpanel/shared/models/match-it-review.model';
import { MATCH_STATISTIC_COLUMN } from '@client/app/resultpanel/shared/models/match-it.model';
import { ModalService } from '@client/app/shared/services';
import { MatchCreateLayerComponent } from '@client/app/resultpanel/insights/match-create-layer/match-create-layer.component';
import { IAccount } from '@client/app/shared/interfaces';
@Component({
  selector: 'ps-insight-result',
  templateUrl: './insight-result.component.html',
  styleUrls: ['./insight-result.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsightResultComponent implements OnInit {
  public readonly EStateInsight = EStateInsight;

  private overlay: DrawingOverlay;

  public showCompactView$: Observable<boolean>;
  public showComparison$: Observable<boolean>;
  public showDensity$: Observable<boolean>;
  public showPercentage$: Observable<boolean>;
  public autoRun$: Observable<boolean>;
  public loading$: Observable<boolean>;
  public createMatchLoading$: Observable<boolean>;
  public polygons$: Observable<IInsightPolygon[]>;
  public results$: Observable<any[]>;
  public groups$: Observable<any[]>;
  public downloadLoading$: Observable<boolean>;
  public state$: Observable<EStateInsight>;
  public selectedPolygonIndex: number = 0;
  public densityValues: any[];
  public polygonOptions$: Observable<PsSelectOption[]>;
  public matchData: any;
  public disablePreviewMatch: boolean = true;
  public matchItLoading$: Observable<boolean>;
  public reviewData$: Observable<ReviewModel>;
  public account$: Observable<IAccount>;

  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private _insightStoreService: InsightStoreService,
    private _layerGroupService: LayerGroupService,
    private _overlayService: OverlayService,
    private _actionMessageService: ActionMessageService,
    private _analysisStoreService: AnalysisStoreService,
    private _layerStyleService: LayerStyleService,
    private _ngZone: NgZone,
    private _modalService: ModalService,
    private _appInsightsService: AppInsightsService,
    private _accountService: AccountService
  ) {
    this.overlay = <DrawingOverlay>this._overlayService.overlays.get('__INSIGHTS');
    const filterData$ = this._insightStoreService.filterData$.pipe(shareReplay(1));
    this.showCompactView$ = filterData$.pipe(map(e => e.showCompactView));
    this.showComparison$ = filterData$.pipe(map(e => e.showComparison));
    this.showDensity$ = filterData$.pipe(map(e => e.showDensity));
    this.showPercentage$ = filterData$.pipe(map(e => e.showPercentage));

    this.autoRun$ = this._insightStoreService.autoRun$;
    this.loading$ = this._insightStoreService.loading$;
    this.matchItLoading$ = this._analysisStoreService.analysisLoading$;
    this.polygons$ = this._insightStoreService.polygons$;
    this.results$ = this._insightStoreService.results$;
    this.groups$ = this._layerGroupService.groups;
    this.downloadLoading$ = this._insightStoreService.downloadLoading$;
    this.state$ = this._insightStoreService.state$;
    this.createMatchLoading$ = this._insightStoreService.createMatchLoading$;
    this._insightStoreService.matchItdensityValues$.subscribe(value=>{
      this.disablePreviewMatch = true;
      this.densityValues = cloneDeep(value);
    })
    this.polygonOptions$ = this.polygons$.pipe(map(e=>e.map((polygon, index)=>({
      label: polygon.label,
      value: index,
    } as PsSelectOption))))
    this._insightStoreService.downloadError$.pipe(takeUntil(this.unsubscribe$)).subscribe(error => {
      if (!error) {
        return;
      }
      this._actionMessageService.sendError(error.error.message);
    })
    this._analysisStoreService.analysisError$.pipe(takeUntil(this.unsubscribe$)).subscribe(error=>{
      if (!error) {
        return;
      }
      this._actionMessageService.sendError(error.error.message);
    })
    this.reviewData$ = this._analysisStoreService.analysisPreview$;
    this.account$ = this._accountService.account;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._insightStoreService.clearResults();
  }

  onToggle(event: { key: string, value: any }) {
    const { key, value } = event;
    this._insightStoreService.setFilter(key, value);
  }

  onLocated({ index }) {
    this._insightStoreService.locatePolygon(index)
  }

  onEdited({ index, label }) {
    this._insightStoreService.editPolygonLabel(index, label);
  }

  onDownload(event){
    this._insightStoreService.downloadInsightResult();
  }

  onCreateMatch(event){
    this._insightStoreService.createMatchIt();
  }

  onPreviewMatch(event){
    this.matchData = event;
    const densityValue = cloneDeep(this.densityValues[this.selectedPolygonIndex]);
    this._insightStoreService.previewMatchIt(this.matchData, densityValue)
  }

  onSaveMatch(reviewData) {
    if(!reviewData) {
      return;
    }
    this._ngZone.run(() => {
      const _createStyle = this._layerStyleService.getDefaultGradientStyle();
      _createStyle.isDefault = false;
      _createStyle.opts = {
        ..._createStyle.opts,
        ...CUSTOM_NEON_GRADIENT_STYLE,
        columnName: MATCH_STATISTIC_COLUMN,
      }
      const ref = this._modalService.openModal(MatchCreateLayerComponent, {
        reviewData,
        title: 'Save Match',
        layerStyle: _createStyle
      })
    })
    this._appInsightsService.logEvent('Insight Tab', 'Save Match', '');
  }

  onChangeState(event){
    this._insightStoreService.changeState(event);
  }

  onChangeShape(event){
    this.selectedPolygonIndex = event;
    this.onFilterChange(this.densityValues[this.selectedPolygonIndex])
  }

  onFilterChange(event){
    if(!event){
      return;
    }

    const numCols = this._checkFilter(event)
    this.disablePreviewMatch = !(numCols > 0 && numCols <= MAXSLIDERSUSED);
  }

  private _checkFilter(data: any) {
    return Object.keys(data).map(layerId => {
      const columnValue = data[layerId];
      const counter = Object.keys(columnValue).map(columnId => {
        const column = columnValue[columnId];
        const isSumCol = Object.keys(column).find(e => e === 'density');
        if (isSumCol) {
          return !!column.weight ? 1 : 0
        } else {
          return Object.keys(column).map(key => key && column[key].weight).filter(e => !!e).length
        }
      });
      return counter.length ? counter.reduce((a, b) => a + b) : 0
    }).reduce((a, b) => a + b);
  }
}
