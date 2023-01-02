import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { IInsightView, IInsightViewManagementState, ILayerInsightView } from '../interface';
import { viewManagementSelectors } from '../store/selectors';
import { IErrorResponse } from '@client/app/shared';
import { viewManagementActions } from '../store/actions';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Injectable({
  providedIn: 'root'
})
export class ViewManagementStoreService {

  constructor(private _store: Store) { }

  public get insight$(): Observable<IInsightViewManagementState> {
    return this._store.select(viewManagementSelectors.selectInsightViewManagement)
  }

  public get insightViews$(): Observable<IInsightView[]> {
    return this._store.select(viewManagementSelectors.selectInsightViews)
  }

  public get insightViewsError$(): Observable<IErrorResponse> {
    return this._store.select(viewManagementSelectors.selectInsightViewsError)
  }

  public get insightViewsLoading$(): Observable<boolean> {
    return this._store.select(viewManagementSelectors.selectInsightViewsLoading)
  }

  public get loadingGetInsightLayers$() {
    return this._store.select(viewManagementSelectors.selectLoadingGetInsightLayer)
  }

  public get insightLayers$(): Observable<ILayerInsightView[]> {
    return this._store.select(viewManagementSelectors.selectInsightLayers)
  }

  public get insightLayerGroupOptions$(): Observable<PsSelectOption[]> {
    return this._store.select(viewManagementSelectors.selectInsightLayerGroupOptions)
  }

  public get editingView$() {
    return this._store.select(viewManagementSelectors.selectEditingView)
  }

  public get isUpdating$() {
    return this._store.select(viewManagementSelectors.selectIsUpdating)
  }

  public get updateError$() {
    return this._store.select(viewManagementSelectors.selectUpdateError)
  }

  getInsightViews(): void{
    this._store.dispatch(viewManagementActions.getInsightViews())
  }

  getInsightLayers(): void{
    this._store.dispatch(viewManagementActions.getViewManagementLayers())
  }

  editInsightView(id: string): void {
    this._store.dispatch(viewManagementActions.editInsightView({ id }))
  }

  createInsightView(view: IInsightView) {
    this._store.dispatch(viewManagementActions.createInsightView({ view }))
  }

  updateInsightView(id: string, view: IInsightView) {
    this._store.dispatch(viewManagementActions.updateInsightView({ id, view }))
  }

  deleteInsightView(id: string) {
    this._store.dispatch(viewManagementActions.deleteInsightView({ id }))
  }

  copyInsightView(id: string) {
    this._store.dispatch(viewManagementActions.copyInsightView({ id }))
  }
}
