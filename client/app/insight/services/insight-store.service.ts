import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { insightResultSelectors } from '../store/selectors';
import { insightResultActions } from '../store/actions';
import { IInsightFilterData, IInsightPolygon } from '../interfaces';
import { IErrorResponse } from '@client/app/shared';
import { IInsightView } from '@client/app/core/modules/view-management/interface';
import { EStateInsight } from '@client/app/shared/enums';
import { MatchItLayerFilter } from '@client/app/resultpanel/shared/models/match-it-filter.model';

@Injectable({
  providedIn: 'root'
})
export class InsightStoreService {
  constructor(
    private _store: Store
  ) { }

  public get insightResultActive$(): Observable<boolean> {
    return this._store.select(insightResultSelectors.selectInsightResultActive);
  }

  public get filterData$(): Observable<IInsightFilterData> {
    return this._store.select(insightResultSelectors.selectFilterData);
  }

  public get polygons$(): Observable<IInsightPolygon[]> {
    return this._store.select(insightResultSelectors.selectPolygons);
  }

  public get results$(): Observable<any[]> {
    return this._store.select(insightResultSelectors.selectResults);
  }

  public get loading$(): Observable<boolean> {
    return this._store.select(insightResultSelectors.selectLoading);
  }

  public get error$(): Observable<IErrorResponse> {
    return this._store.select(insightResultSelectors.selectError);
  }

  public get autoRun$(): Observable<boolean> {
    return this._store.select(insightResultSelectors.selectAutoRun);
  }

  public get selectedView$(): Observable<IInsightView> {
    return this._store.select(insightResultSelectors.selectSelectedView);
  }

  public get downloadLoading$(): Observable<boolean> {
    return this._store.select(insightResultSelectors.selectDownloadLoading);
  }

  public get downloadError$(): Observable<IErrorResponse> {
    return this._store.select(insightResultSelectors.selectDownloadError);
  }

  public get state$(): Observable<EStateInsight> {
    return this._store.select(insightResultSelectors.selectState);
  }

  public get matchItLayerFilter$(): Observable<MatchItLayerFilter[]> {
    return this._store.select(insightResultSelectors.selectMatchItLayerFilter);
  }

  public get matchItdensityValues$(): Observable<any[]> {
    return this._store.select(insightResultSelectors.selectMatchItdensityValues);
  }

  public get createMatchLoading$(): Observable<boolean> {
    return this._store.select(insightResultSelectors.selectCreateMatchLoading);
  }

  setFilter(key: string, value: any) {
    this._store.dispatch(insightResultActions.setFilter({ key, value }))
  }

  enableAutoRun(value: boolean) {
    this._store.dispatch(insightResultActions.enableAutoRun({ value }))
  }

  getInsightResult() {
    this._store.dispatch(insightResultActions.getInsightResult())
  }

  cancelGetInsightResult() {
    this._store.dispatch(insightResultActions.cancelGetInsightResult())
  }

  downloadResult() {
    this._store.dispatch(insightResultActions.downloadInsightResult())
  }

  activeInsightResult(value: boolean) {
    this._store.dispatch(insightResultActions.activeInsightResult({ value }))
  }

  selectView(id: string) {
    this._store.dispatch(insightResultActions.selectInsightView({ id }))
  }

  editPolygonLabel(index: number, label: string) {
    this._store.dispatch(insightResultActions.editPolygonLabel({ index, label }))
  }

  locatePolygon(index: number) {
    this._store.dispatch(insightResultActions.locatePolygon({ index }))
  }

  downloadInsightResult() {
    this._store.dispatch(insightResultActions.downloadInsightResult())
  }

  changeState(state: EStateInsight) {
    this._store.dispatch(insightResultActions.changeState({ state }))
  }

  createMatchIt() {
    this._store.dispatch(insightResultActions.createMatch())
  }

  previewMatchIt(formValue: any, densityValue: any) {
    this._store.dispatch(insightResultActions.previewMatch({formValue, densityValue}))
  }

  clearResults() {
    this._store.dispatch(insightResultActions.clearResults());
  }
}
