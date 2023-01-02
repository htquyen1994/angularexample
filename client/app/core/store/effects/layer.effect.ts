import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { tap, switchMap, catchError } from 'rxjs/operators';
import { layerActions } from "../actions";
import { LayerLogicService } from "../../services/layer-logic.service";
import { decorateError } from '@client/app/shared/http.util';

@Injectable()
export class LayerEffects {
  constructor(
    private _actions$: Actions,
    private _layerLogicService: LayerLogicService
  ) { }

  @Effect()
  getLayers$ = this._actions$.pipe(
    ofType(layerActions.getLayers),
    switchMap(_ => {
      return this._layerLogicService.getLayerGroups().pipe(
        switchMap(({ layers, groups }) => [layerActions.getLayersSuccess({ layerGroups: groups, layers })]),
        catchError(error=> [layerActions.getLayersFail({error: decorateError(error)})])
      );
    }),
    catchError(error=> [layerActions.getLayersFail({error: decorateError(error)})])
  );

  @Effect()
  getFilter$ = this._actions$.pipe(
    ofType(layerActions.getFilters),
    switchMap(_ => {
      const filters = this._layerLogicService.getFilters();
      return [layerActions.getFiltersSuccess({filters})];
    }),
    catchError(error=> [layerActions.getFiltersFail({error: decorateError(error)})])
  );
}
