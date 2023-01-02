import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { resultPanelSelectors } from '../store/selectors';
import { resultPanelActions } from '../store/actions';
import { TabName } from '@client/app/shared/models/resultpanel.model';
@Injectable({
  providedIn: 'root'
})
export class ResultPanelStoreService {

  constructor(
    private _store: Store
  ) { }

  get tabs$() {
    return this._store.select(resultPanelSelectors.selectTabStateTabs)
  }

  get tabLoading$() {
    return this._store.select(resultPanelSelectors.selectTabStateLoading)
  }

  get activeTab$() {
    return this._store.select(resultPanelSelectors.selectTabStateActiveTab)
  }

  getTabs() {
    this._store.dispatch(resultPanelActions.settingTabs())
  }

  setActiveTab(id: TabName) {
    this._store.dispatch(resultPanelActions.setActiveTab({ id }))
  }

  openTab(id: TabName) {
    this._store.dispatch(resultPanelActions.toggleTab({ id, value: true }))
  }

  closeTab(id: TabName) {
    this._store.dispatch(resultPanelActions.toggleTab({ id, value: false }))
  }
}
