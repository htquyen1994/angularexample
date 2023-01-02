import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { functionalitySelectors } from '../store/selectors';
import { FunctionalityFilterState, FunctionalityResultState } from '../interfaces';
import { IErrorResponse } from '@admin-shared/models/error';
import { functionalityActions } from '../store/actions';

@Injectable({
  providedIn: 'root'
})
export class FunctionalityStoreService {

  constructor(
    private _store: Store
  ) { }
  public get filter$(): Observable<FunctionalityFilterState> {
    return this._store.select(functionalitySelectors.selectFilter);
  }

  public get result$(): Observable<FunctionalityResultState> {
    return this._store.select(functionalitySelectors.selectResult);
  }

  public get loading$(): Observable<boolean> {
    return this._store.select(functionalitySelectors.selectLoading);
  }

  public get downloading$(): Observable<boolean> {
    return this._store.select(functionalitySelectors.selectDownloading);
  }

  public get error$(): Observable<IErrorResponse> {
    return this._store.select(functionalitySelectors.selectError);
  }

  public getFunctionality(tenantId: string) {
    this._store.dispatch(functionalityActions.getFunctionality({ tenantId }))
  }

  public downloadFunctionality() {
    this._store.dispatch(functionalityActions.downloadFunctionality())
  }
}
