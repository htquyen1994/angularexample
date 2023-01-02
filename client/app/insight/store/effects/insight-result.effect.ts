import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { insightResultActions } from '../actions';
import { switchMap, withLatestFrom, map, tap, catchError, takeUntil } from 'rxjs/operators';
import { InsightLogicService, InsightStoreService, InsightApiService } from '../../services';
import { decorateError, createSimpleError } from '@client/app/shared/http.util';
import { forkJoin } from 'rxjs';
import { AccountService, LayerGroupService } from '@client/app/shared';
import { ViewManagementStoreService } from '@client/app/core/modules/view-management/services';
import { MatchItService } from '@client/app/resultpanel/shared/services/match-it.service';
import { EStateInsight, ActionMessageType } from '@client/app/shared/enums';
import { MatchItLayer, MatchItColumn } from '@client/app/resultpanel/shared/models/match-it-filter.model';
import { analysisActions } from '../../../analysis/store/actions'
import { messageActions } from '@client/app/core/store/actions';
import { resultPanelActions } from '@client/app/resultpanel/store/actions';
import { TabName } from '@client/app/shared/models/resultpanel.model';
import { PanelStoreService } from '@client/app/core/services';
import { ResultPanelCollapseState } from '@client/app/core/enums';
import { panelActions } from '@client/app/core/store/actions';

@Injectable()
export class InsightResultEffects {
  constructor(
    private _actions$: Actions,
    private _insightLogicService: InsightLogicService,
    private _insightApiService: InsightApiService,
    private _accountService: AccountService,
    private _insightStoreService: InsightStoreService,
    private _viewManagementStoreService: ViewManagementStoreService,
    private _layerGroupService: LayerGroupService,
    private _matchItService: MatchItService,
    private _panelStoreService: PanelStoreService
  ) { }


  @Effect()
  getInsightResult$ = this._actions$.pipe(
    ofType(insightResultActions.getInsightResult),
    withLatestFrom(
      this._insightStoreService.selectedView$,
      this._accountService.account.pipe(map(e => e.isMetric)),
      this._panelStoreService.resultPanelState$
    ),
    switchMap(([_, selectedView, isMetric, resultPanelState]) => {
      const shapesObservables = this._insightLogicService.collectShapesAsObservable(selectedView, isMetric);
      if (shapesObservables.length == 0) {
        return [insightResultActions.getInsightResultFail(createSimpleError("Please select shape"))]
      }

      return forkJoin(shapesObservables).pipe(
        takeUntil(this._actions$.pipe(ofType(insightResultActions.cancelGetInsightResult))),
        switchMap(insightPolygons => {
          const length = insightPolygons.map(e=>e.length).reduce((a,b)=>a+b);
          if(length > 5){
            return [insightResultActions.getInsightResultFail({error: createSimpleError("A maximum of 5 shapes is supported in this version")})]
          }
          const polygons = insightPolygons.map(({ requests, length }, shapeIndex) => requests.map((polygon, polygonIndex) => ({
            label: String.fromCharCode(97 + shapeIndex).toUpperCase() + (polygonIndex + 1) + (polygon.label === '' ? '' : `(${polygon.label})`),
            type: polygon.label,
            shape: polygon.shape
          }))).reduce((a, b) => [...a, ...b])
          return this._insightLogicService.createInsightRequest(selectedView, polygons).pipe(
            takeUntil(this._actions$.pipe(ofType(insightResultActions.cancelGetInsightResult))),
            switchMap(({ insightRequest, polygons }) => insightRequest.pipe(
              takeUntil(this._actions$.pipe(ofType(insightResultActions.cancelGetInsightResult))),
              switchMap(({ results, polygons }) => {
                this._insightLogicService.createPolygons(polygons);
                const actions: any[] = [
                  insightResultActions.changeState({state: EStateInsight.InsightView}),
                  insightResultActions.getInsightResultSuccess({ results, polygons }),
                  resultPanelActions.setActiveTab({id: TabName.INSIGHTS})
                ]
                if(resultPanelState === ResultPanelCollapseState.CLOSE){
                  actions.push(panelActions.setResultPanelState({id: ResultPanelCollapseState.HALF_SCREEN}))
                }
                return actions
              }),
              catchError(error=> [insightResultActions.getInsightResultFail({error: decorateError(error)})])
            ))
          )
        }),
        catchError(error=> [insightResultActions.getInsightResultFail({error: decorateError(error)})])
      )
    }),
    catchError(error=> [insightResultActions.getInsightResultFail({error: decorateError(error)})])
  );

  @Effect()
  selectInsightView$ = this._actions$.pipe(
    ofType(insightResultActions.selectInsightView),
    withLatestFrom(
      this._viewManagementStoreService.insightViews$,
    ),
    switchMap(([{ id }, views]) => {
      const view = views.find(e => e.id == id);
      return [insightResultActions.selectInsightViewSuccess({ view })]
    })
  );

  @Effect({dispatch: false})
  locateInsightShape$ = this._actions$.pipe(
    ofType(insightResultActions.locatePolygon),
    withLatestFrom(
      this._insightStoreService.polygons$,
    ),
    tap(([{index}, polygons]) => {
      const polygon = polygons[index];
      if(!polygon) {
        return;
      }
      this._insightLogicService.onLocate(polygon);
    })
  );

  @Effect({dispatch: false})
  editInsightPolygonLabel$ = this._actions$.pipe(
    ofType(insightResultActions.editPolygonLabel),
    tap(({index, label}) => {
      this._insightLogicService.editLabelPolygon(index, label);
    })
  );

  @Effect()
  downloadInsightResult$ = this._actions$.pipe(
    ofType(insightResultActions.downloadInsightResult),
    withLatestFrom(
      this._insightStoreService.results$,
      this._insightStoreService.polygons$,
      this._insightStoreService.filterData$,
      this._layerGroupService.groups,
    ),
    switchMap(([_, results, polygons, filterData, groups]) => {
      const { showComparison, showPercentage } = filterData;
      return this._insightApiService.downloadInsight(results, polygons, showPercentage, groups, showComparison).pipe(
        switchMap(()=>[insightResultActions.downloadInsightResultSuccess()]),
        catchError(()=>[insightResultActions.downloadInsightResultFail(decorateError('Download fail!'))])
      )
    }),
    catchError(()=>[insightResultActions.downloadInsightResultFail(decorateError('Download fail!'))])
  );

  @Effect()
  createMatch$ = this._actions$.pipe(
    ofType(insightResultActions.createMatch),
    withLatestFrom(
      this._insightStoreService.results$,
      this._insightStoreService.polygons$
    ),
    switchMap(([_, results, polygons]) => {
      if(!results) {
        return [insightResultActions.createMatchFail({error:createSimpleError("Could not create match")})]
      }
      const requestParams: MatchItLayer[] =  results.map(e => {
        let columns = [];
        e.data.filter(_e => _e).forEach(_e => {
          columns = [
            ...columns,
            ..._e.children.map(e => {
              return {
                columnId: e.columnId,
                values: e.values && e.values[0] && e.values[0]['list'] ? e.values[0]['list'].map(l => l.key) : undefined
              }
            })]
        })
        return {
          dataPackageId: e.layer.id,
          columns: columns,
          source: e.layer.source,
          owner:  e.layer.owner
        }
      })
      return this._matchItService.getFilters(requestParams).pipe(
        map((layers)=>{
          const densityValues = this._insightLogicService.decorateFilter(layers, results, polygons);
          return {
            layers,
            densityValues: densityValues? densityValues.densityValues: []
          }
        }),
        switchMap((data) => {
          const { layers, densityValues } = data;
          if(!densityValues.length){
            return [
              messageActions.addMessage({ message: { type: ActionMessageType.WARNING, value: 'There are no matchable columns in the view.' } }),
              insightResultActions.createMatchSuccess({ densityValues, matchItLayerFilters: layers })
            ]
          }
          return [
            insightResultActions.changeState({ state: EStateInsight.FilterView }),
            insightResultActions.createMatchSuccess({densityValues, matchItLayerFilters: layers})
          ]
        }),
        catchError((error)=>[insightResultActions.createMatchFail({error: decorateError(error)})])
      )
    }),
    catchError((error)=>[insightResultActions.createMatchFail({error: decorateError(error)})])
  );

  @Effect()
  previewMatch$ = this._actions$.pipe(
    ofType(insightResultActions.previewMatch),
    withLatestFrom(
      this._insightStoreService.polygons$,
      this._insightStoreService.matchItLayerFilter$,
    ),
    switchMap(([_, polygons, matchItLayerFilters]) => {
      try {
        const { densityValue, formValue } = _;
        const { desiredMatch, resolution, shape  } = formValue;
        const { area } = polygons[shape];
        const _matchItLayerFilters = [];
        matchItLayerFilters.forEach(layer => {
          const _matchItColumns: MatchItColumn[] = []
          const {matchItColumns, dataPackageId, owner, source } = layer;
          matchItColumns.forEach(column => {
            let col: MatchItColumn;
            if(!densityValue[dataPackageId]){
              return;
            }
            const { values, columnId } = column;
            if (!densityValue[dataPackageId][column.columnId]) {
              return;
            }
            if (values && values.length > 0) {
              values.forEach(val => {
                const { key } = val;
                if (!(densityValue[dataPackageId][columnId][key])) {
                  return;
                }
                const { count, weight } = densityValue[dataPackageId][columnId][key];
                col = {
                  ...column,
                  ...val,
                  values: undefined,
                  count,
                  weight
                }
                _matchItColumns.push(col);
              })
            } else {
              const { count, weight } = densityValue[dataPackageId][columnId];
              col = {
                ...column,
                count,
                weight
              }
              _matchItColumns.push(col);
            }
          });
          const matchItColumnsFiltered = _matchItColumns.filter(e => e.weight > 0);
          if(matchItColumnsFiltered.length){
            _matchItLayerFilters.push({ ...layer, matchItColumns: matchItColumnsFiltered, source, owner });
          }
        });
        return [analysisActions.getAnalysisPreview({payload: {
          desiredMatch,
          resolution,
          matchItLayerFilters: _matchItLayerFilters,
          area: area
        }})]
      } catch (error) {
        return [insightResultActions.previewMatchFail({error: decorateError(error)})]
      }
    }),
    catchError((error)=>[insightResultActions.previewMatchFail({error: decorateError(error)})])
  );

  @Effect({ dispatch: false })
  clearResult$ = this._actions$.pipe(
    ofType(insightResultActions.clearResults),
    tap(() => {
      this._insightLogicService.clearPolygons();
    })
  )
}
