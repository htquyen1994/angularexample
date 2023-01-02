import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/admin/app/store/state/app.state';
import { ReferenceDataSelector } from '../store/selectors';
import { ReferenceDataActions } from '../store/actions';
import { ISort } from '@admin-shared/models/common-table';
import { ReferenceDataFilter, IReferenceData } from '../models';


@Injectable()
export class ReferenceDataStoreService {

  constructor(private _store: Store<IAppState>) { }

  get selectReferenceFilter$() {
    return this._store.select(ReferenceDataSelector.selectReferenceFilter)
  }

  get selectReferenceSort$() {
    return this._store.select(ReferenceDataSelector.selectReferenceSort)
  }

  get selectReferenceData$() {
    return this._store.select(ReferenceDataSelector.selectReferenceData)
  }

  get selectReferenceFilteredData$() {
    return this._store.select(ReferenceDataSelector.selectReferenceFilteredData)
  }

  get selectReferenceLoading$() {
    return this._store.select(ReferenceDataSelector.selectReferenceLoading)
  }

  get selectReferenceIsRefresh$() {
    return this._store.select(ReferenceDataSelector.selectReferenceIsRefresh)
  }

  loadReferenceData(){
    this._store.dispatch(ReferenceDataActions.loadReferenceDatas());
  }

  selectReferenceData(item: IReferenceData, checked: boolean) {
    this._store.dispatch(ReferenceDataActions.selectReferenceData({ item, checked }))
  }

  selectAllReferenceData(checked) {
    this._store.dispatch(ReferenceDataActions.selectAllReferenceData({ checked }))
  }

  changeFilter(filter: ReferenceDataFilter) {
    this._store.dispatch(ReferenceDataActions.changeFilter(
      {
        filter
      }
    ))
  }

  changeSort(sort: ISort) {
    this._store.dispatch(ReferenceDataActions.changeSort(
      {
        sort
      }
    ))
  }
}
