import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, ViewChild, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { H3_RESOLUTIONS, LayerGroupService, LayerService, unique, ActionMessageService, AppInsightsService, LayerStyleGradient, LayerStyle, LayerStyleService, COLOUR_RAMPS, CUSTOM_NEON_GRADIENT_STYLE } from '../../shared';
import { FindState, FindLayer, FindCriteria, FIND_STATISTIC_COLUMN } from './find.model'
import { BehaviorSubject, Observable, Subject, combineLatest, Subscription, ReplaySubject, of } from 'rxjs';
import { FindService } from './find.service';
import { takeUntil, map } from 'rxjs/operators';
import { ILayer, ILayerColumn, ILayerColumnGroup, ILayerGroup } from '../../shared/interfaces';
import { MatchItColumn } from '../shared/models/match-it-filter.model';
import { WeightingsSetupComponent } from './weightings-setup/weightings-setup.component';
import { MatchItPreviewService } from '../shared/services/match-it-preview.service';
import { decorateError } from '../../shared/http.util';
import { MatchCreateLayerComponent } from '../insights/match-create-layer/match-create-layer.component';
import { ModalService } from '../../shared/services/modal.service';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { ReviewModel } from '../shared/models/match-it-review.model';

@Component({
  selector: 'ps-find',
  templateUrl: './find.component.html',
  styleUrls: ['./find.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [MatchItPreviewService]
})
export class FindComponent implements OnInit {
  @ViewChild('weightingSetupEl') weightingSetupEl: WeightingsSetupComponent;

  public stateView: FindState = FindState.WEIGHTING_SETUP;
  public readonly  H3_RESOLUTIONS: PsSelectOption[] = H3_RESOLUTIONS.map(e => ({ value: e.resolution, label: e.label }));
  public FindState = FindState;
  public findForm: FormGroup = new FormGroup({
    desiredMatch: new FormControl(50, [Validators.required, Validators.max(25000)]),
    resolution: new FormControl(4)
  });
  public isWeighSetupValid = false;
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public infoFilterMessage = false;
  public layersSource$: Observable<FindLayer[]>;
  public layers$: Observable<ILayer[]>;
  public data$  = new Observable<{layers: ILayer[], layerGroups: { groupId: number, name: string, layers: ILayer[] }[]}>();
  public layerGroups$: Observable<{ groupId: number, name: string, layers: ILayer[] }[]>;
  public reviewDataSource = new BehaviorSubject<ReviewModel>(null);
  public reviewData$: Observable<ReviewModel> = this.reviewDataSource.asObservable()

  private unsubscribe$: Subject<void> = new Subject<void>();
  private previewSubscription: Subscription;

  constructor(
    private findService: FindService,
    private layerGroupService: LayerGroupService,
    private layerService: LayerService,
    private cd: ChangeDetectorRef,
    private matchItPreviewService: MatchItPreviewService,
    private actionMessageService: ActionMessageService,
    private applicationInsightsService: AppInsightsService,
    private modalService: ModalService,
    private ngZone: NgZone,
    private layerStyleService: LayerStyleService
  ) { }

  public ngOnInit(): void {
    this.isLoading$.next(true);
    this.layersSource$ = this.findService.getFindLayers();
    this.data$ = combineLatest(
      this.layersSource$,
      this.layerGroupService.groups
    ).pipe(
      map(([_layers, _layerGroups]) => {
        const layerGroups: { groupId: number, name: string, layers: ILayer[] }[] = _layerGroups.map(group => {
          const layers = group.layers.map(layer => {
            const matchLayer = _layers.find(e => e.dataPackageId === layer.id);

            if (!matchLayer) {
              return null;
            }

            if(!(matchLayer.matchItColumns && matchLayer.matchItColumns.length > 0)){
              return null;
            }

            const { columns, columnGroups } = this.getMatchColumns(matchLayer.matchItColumns, layer.columns, layer.columnGroups);
            return {
              ...layer,
              columns,
              columnGroups
            }
          }).filter(e => !!e);

          if(layers.length === 0){
            return null;
          }

          return {
            name: group.name,
            groupId: group.id,
            layers
          }
        }).filter(e=>!!e);

        const _layersInGroup = layerGroups.map(e => e.layers);
        const layers: ILayer[] =_layersInGroup.length ? _layersInGroup.reduce((a, b) => ([...a, ...b])): [];

        this.isLoading$.next(false);
        return { layers, layerGroups };
      }),
      takeUntil(this.unsubscribe$)
    )
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public getMatchColumns(matchColumns: MatchItColumn[], layerColumns: ILayerColumn[], layerColumnGroups: ILayerColumnGroup[]): { columns: ILayerColumn[], columnGroups: ILayerColumnGroup[] } {
    const columns = matchColumns.map(e => {
      const column = layerColumns.find(_e => _e.id === e.columnId);
      if (column) {
        if (e.values) {
          return { ...column, list: [...e.values] }
        }
        return { ...column, columnAlias: e['columnAlias'], matchCommonGeoColumnId: e.matchCommonGeoColumnId };
      }
      return null;
    }).filter(e => !!e);
    const columnGroups = columns.map(e => e.groupId).filter(unique).map(groupId => {
      const columnGroup = layerColumnGroups.find(_e => _e.Index == groupId);
      return { ...columnGroup, children: columns.filter(_e => _e.groupId == groupId) };
    }).filter(e => !!e);
    return {
      columns,
      columnGroups
    };
  }

  public onWeightingsSetupStatusChange(event) {
    const { isValid } = event;
    this.isWeighSetupValid = isValid;
    this.cd.detectChanges();
  }

  public onForwardPreview() {
    if (!this.reviewDataSource.value) {
      return;
    }
    this.unsubscribePreviewRequest();
    // this.matchItPreviewService.nextReviewData(this.reviewData);
    this.stateView = FindState.PREVIEW;
    this.applicationInsightsService.logEvent('Find Tab', 'Forward to Preview', '');
  }

  public onBackwardWeightingSetup() {
    this.unsubscribePreviewRequest();
    this.stateView = FindState.WEIGHTING_SETUP;
    this.cd.detectChanges();
    this.applicationInsightsService.logEvent('Find Tab', 'Back to Weighting setup', '');
  }

  public reviewLayer() {
    console.log(this.weightingSetupEl.getRawValue())
    const { desiredMatch, resolution } = this.findForm.getRawValue();
    this.getPreviewFindData({ desiredMatch, resolution, matchItLayerFilters: this.weightingSetupEl.getRawValue() });
    this.applicationInsightsService.logEvent('Find Tab', 'Run Find', '');
  }

  public getPreviewFindData(model: FindCriteria) {
    this.isLoading$.next(true);
    this.previewSubscription = this.findService.previewFind(model).pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.reviewDataSource.next(res);
      this.stateView = FindState.PREVIEW;
      this.isLoading$.next(false);
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message)
      this.isLoading$.next(false);
    })
  }

  public onSave() {
    this.ngZone.run(() => {
      const _createStyle =  this.layerStyleService.getDefaultGradientStyle();
      _createStyle.isDefault = false;
      _createStyle.opts = {
        ..._createStyle.opts,
        ...CUSTOM_NEON_GRADIENT_STYLE,
        columnName: FIND_STATISTIC_COLUMN
      }
      const reviewData = this.reviewDataSource.value;
      const ref = this.modalService.openModal(MatchCreateLayerComponent, {
        reviewData,
        title: 'Save Find',
        isNotify: false,
        layerStyle: _createStyle
      })
    })
    this.applicationInsightsService.logEvent('Find Tab', 'Save Find', '');
  }


  public unsubscribePreviewRequest() {
    if (this.previewSubscription) this.previewSubscription.unsubscribe();
  }
}
