import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { switchMap, catchError, withLatestFrom } from 'rxjs/operators';
import { functionalityActions } from "../actions";
import { FunctionalityApiService, FunctionalityLogicService, FunctionalityStoreService } from "../../services";
import { decorateError } from "../../../../shared/models/error";

@Injectable()
export class FunctionalityEffects {
  constructor(
    private _actions$: Actions,
    private _functionalityApiService: FunctionalityApiService,
    private _functionalityLogicService: FunctionalityLogicService,
    private _functionalityStoreService: FunctionalityStoreService
  ) { }

  @Effect()
  getFunctionality$ = this._actions$.pipe(
    ofType(functionalityActions.getFunctionality),
    switchMap(({tenantId}) => {
      return this._functionalityApiService.getFunctionality(tenantId).pipe(
        switchMap(_data=>{
          const { claims, data } = this._functionalityLogicService.decorateData(_data);
          return [
            functionalityActions.getFunctionalitySuccess({ claims, data })
          ]
        }),
        catchError((error)=>[functionalityActions.getFunctionalityFail({error: decorateError(error)})])
      )
    }),
    catchError((error)=>[functionalityActions.getFunctionalityFail({error: decorateError(error)})])
  );

  @Effect()
  downloadFunctionality$ = this._actions$.pipe(
    ofType(functionalityActions.downloadFunctionality),
    withLatestFrom(
      this._functionalityStoreService.filter$
    ),
    switchMap(([_, { tenantId }]) => {
      return this._functionalityApiService.downloadFunctionality(tenantId).pipe(
        switchMap(_data => {
          return [
            functionalityActions.downloadFunctionalitySuccess()
          ]
        }),
        catchError((error) => [functionalityActions.downloadFunctionalityFail({ error: decorateError(error) })])
      )
    }),
    catchError((error) => [functionalityActions.downloadFunctionalityFail({ error: decorateError(error) })])
  );
}
