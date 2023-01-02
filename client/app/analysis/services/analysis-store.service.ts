import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ReviewModel } from '../../resultpanel/shared/models/match-it-review.model';

import { analysisSelectors } from '../store/selectors';
import { AnalysisPreviewPayload } from '../interfaces';
import { analysisActions } from '../store/actions';
import { MatchItCriteria } from '@client/app/resultpanel/shared/models/match-it-filter.model';
import { IErrorResponse } from '@client/app/shared';

@Injectable({
  providedIn: 'root'
})
export class AnalysisStoreService {

  constructor(
    private _store: Store
  ) { }

  public get analysisPreview$(): Observable<ReviewModel> {
    return this._store.select(analysisSelectors.selectPreviewModel);
  }

  public get analysisLoading$(): Observable<boolean> {
    return this._store.select(analysisSelectors.selectLoading);
  }

  public get analysisError$(): Observable<IErrorResponse> {
    return this._store.select(analysisSelectors.selectError);
  }

  public getAnalysisPreview(payload: MatchItCriteria) {
    this._store.dispatch(analysisActions.getAnalysisPreview({ payload }))
  }
}
