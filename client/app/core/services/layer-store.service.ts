import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { appSelectors } from '../store/selectors';
import { layerActions } from '../store/actions';

@Injectable({
  providedIn: 'root'
})
export class LayerStoreService {

  constructor(
    private _store: Store
  ) { }

  get layers$() {
    return this._store.select(appSelectors.selectLayers)
  }

  get layerGroups$() {
    return this._store.select(appSelectors.selectLayerGroups)
  }

  get filters$() {
    return this._store.select(appSelectors.selectFilters)
  }

  getLayers(){
    this._store.dispatch(layerActions.getLayers())
  }

  getFilters(){
    this._store.dispatch(layerActions.getFilters())
  }
}
