import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { switchMap, catchError } from 'rxjs/operators';
import { analysisActions } from '../actions';
import { MatchItService } from '@client/app/resultpanel/shared/services/match-it.service';
import { decorateError } from '@client/app/shared/http.util';
import { insightResultActions } from '../../../insight/store/actions';
import { EStateInsight } from '@client/app/shared/enums';

@Injectable()
export class AnalysisEffects {
  constructor(
    private _actions$: Actions,
    private _matchItService: MatchItService
  ) { }

  @Effect()
  previewMatch$ = this._actions$.pipe(
    ofType(analysisActions.getAnalysisPreview),
    switchMap(({payload}) => {
      return this._matchItService.reviewMatchItForm(payload).pipe(
        switchMap(data=>{
          return [
            analysisActions.getAnalysisPreviewSuccess({payload: data}),
            insightResultActions.changeState({state: EStateInsight.PreviewView})
          ]
        }),
        catchError((error)=>[analysisActions.getAnalysisPreviewFail({error: decorateError(error)})])
      )
    }),
    catchError((error)=>[analysisActions.getAnalysisPreviewFail({error: decorateError(error)})])
  );
}
