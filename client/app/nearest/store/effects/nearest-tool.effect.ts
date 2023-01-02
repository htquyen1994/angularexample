import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { LayerStoreService } from '@client/app/core/services';
import { nearestToolActions, nearestResultActions } from '../actions';
import { withLatestFrom, switchMap, concatMap } from 'rxjs/operators';
import { SelectionService, createSimpleError } from '@client/app/shared';
import { NearestLogicService } from '../../services';
import { forkJoin } from 'rxjs';
import { messageActions } from '@client/app/core/store/actions';
import { ActionMessageType } from '@client/app/shared/enums';

@Injectable()
export class NearestToolEffects {
  constructor(
    private _actions$: Actions,
    private _layerStoreService: LayerStoreService,
    private _selectionService: SelectionService,
    private _nearestLogicService: NearestLogicService
  ) { }

  @Effect()
  changeLayer$ = this._actions$.pipe(
    ofType(nearestToolActions.changeLayer),
    withLatestFrom(
      this._layerStoreService.filters$
    ),
    switchMap(([{ layerId }, filters]) => {
      const filter = filters.find(e => e.layerId === layerId);
      return [nearestToolActions.setFilters({ filter })]
    }),
  );

  @Effect()
  getShapes$ = this._actions$.pipe(
    ofType(nearestToolActions.getShapes),
    switchMap((_) => {
      const {requests} = this._nearestLogicService.getShapes();
      return forkJoin(requests).pipe(
        switchMap((responses)=>{
          const _shapes = responses.map(e=>e.shapes);
          if(!_shapes.length){
            return [
              messageActions.addMessage({message: {type: ActionMessageType.INFO, value: "You have not selected any points on the map."}})
            ]
          }
          const shapes = _shapes.length ? _shapes.reduce((a, b) => [...a, ...b]) : []
          if(shapes.length > 25){
            return [messageActions.addMessage({message: {type: ActionMessageType.INFO, value: "Please don't select  more than 25 points for nearest."}})]
          }

          return [nearestToolActions.getShapesSuccess({shapes})]
        })
      )
    }),
  );

}
