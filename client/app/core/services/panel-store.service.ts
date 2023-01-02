import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { appSelectors } from '../store/selectors';
import { panelActions } from '../store/actions';
import { ResultPanelCollapseState } from '../enums';
@Injectable({
  providedIn: 'root'
})
export class PanelStoreService {
  constructor(
    private _store: Store
  ) { }

  get resultPanelState$() {
    return this._store.select(appSelectors.selectResultPanelState)
  }

  setResultPanelState(id: ResultPanelCollapseState){
    this._store.dispatch(panelActions.setResultPanelState({id}))
  }
}
