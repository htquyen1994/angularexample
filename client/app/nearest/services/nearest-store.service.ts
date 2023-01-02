import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { nearestSelectors } from '../store/selectors';
import { nearestToolActions, nearestResultActions } from '../store/actions';
import { NearestToolPayload } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class NearestStoreService {

  constructor(
    private _store: Store
  ) { }

  get filters$() {
    return this._store.select(nearestSelectors.selectNearestToolFilters)
  }

  get toolPayload() {
    return this._store.select(nearestSelectors.selectNearestToolFormGroup)
  }

  get pointShapes$() {
    return this._store.select(nearestSelectors.selectNearestToolPointShapes)
  }

  get results$() {
    return this._store.select(nearestSelectors.selectNearestResults)
  }

  get loading$() {
    return this._store.select(nearestSelectors.selectNearestResultLoading)
  }

  get downloading$() {
    return this._store.select(nearestSelectors.selectNearestResultDownLoading)
  }

  get error$() {
    return this._store.select(nearestSelectors.selectNearestResultError)
  }

  get columns$() {
    return this._store.select(nearestSelectors.selectNearestResultColumns)
  }

  get resultPayload$() {
    return this._store.select(nearestSelectors.selectNearestResultPayload)
  }

  changeLayer(layerId) {
    this._store.dispatch(nearestToolActions.changeLayer({ layerId }))
  }

  getShapePoints() {
    this._store.dispatch(nearestToolActions.getShapes());
  }

  getNearestResult(payload: NearestToolPayload) {
    this._store.dispatch(nearestResultActions.getNearestResult({ payload }))
  }

  clearResults() {
    this._store.dispatch(nearestResultActions.clearResults());
  }

  download() {
    this._store.dispatch(nearestResultActions.download());
  }

  cancelGetResult() {
    this._store.dispatch(nearestResultActions.cancelGetNearestResult())
  }

  zoomAll(){
    this._store.dispatch(nearestResultActions.zoomAll());
  }

  zoomToFeature(shapeId: any){
    this._store.dispatch(nearestResultActions.zoomToFeature({shapeId}));
  }
}
