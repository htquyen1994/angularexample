import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { tap, observeOn, switchMap, catchError, map } from 'rxjs/operators';
import { mapToolsActions, messageActions } from "../actions";
import { ActionMessageService, OverlayService, LayerService, OverlayShape, SelectionService } from '@client/app/shared';
import { asyncScheduler, Observable, of, forkJoin, throwError } from 'rxjs';
import { MapToolLogicService } from '../../services';
import { ISelection } from '@client/app/shared/interfaces';
import { ActionMessageType } from '@client/app/shared/enums';
import { decorateError } from '@client/app/shared/http.util';

@Injectable()
export class MapToolsEffects {
  constructor(
    private _actions$: Actions,
    private _mapToolLogicService: MapToolLogicService,
    private _overlayService: OverlayService,
    private _layerService: LayerService,
    private _selectionService: SelectionService
  ) { }

  @Effect()
  selectShapesByShape$ = this._actions$.pipe(
    ofType(mapToolsActions.getShapesByPolygon),
    switchMap(({shapeId, overlayId})=>{
      const shape = this._mapToolLogicService.getShapeDetail(overlayId, shapeId);
      return shape.pipe(
        switchMap(shape => {
          const { coordinates, type } = shape;
          const geom = coordinates.map(points => {
            return points.map(point => {
              return { lat: point[1], lng: point[0] };
            });
          });
          const polygon = new google.maps.Polygon({
            paths: geom
          });

          const selections: Observable<ISelection>[] = [];
          const isSelected = (this._selectionService.selectionStore
            .get(overlayId) || new Set()).has(shapeId);
          this._overlayService.overlays.forEach((overlay) => {
            if (overlay.id === '__FILTER') {
              return;
            }
            if (overlay.id.startsWith('__')) {
              const shapeIds: string[] = []
              overlay.allShapes((shape: OverlayShape) => {
                if (shape instanceof OverlayShape && shape.containsPolygon(polygon)) {
                  shapeIds.push(shape.id);
                }
              });
              if (!shapeIds.length) {
                return;
              }
              const selection: ISelection = {
                isAdd: true,
                overlayId: overlay.id,
                shapeId: null,
                shapeIds: shapeIds
              }
              selections.push(of(selection))
            }

            if (this._layerService.layerActiveStore && overlay.id === this._layerService.layerActiveStore.id) {
              selections.push(this._mapToolLogicService.getRecordsByPolygonInLayer(overlay.id, shape))
            }
          });
          selections.push(of({ isAdd: isSelected, shapeId, overlayId }))
          return forkJoin(selections).pipe(
            switchMap((selections) => {
              selections.forEach(_selection => {
                this._selectionService.changeSelection(_selection);
              })
              return [mapToolsActions.getShapesByPolygonSuccess()]
            }),
            catchError((e) => [
              mapToolsActions.getShapesByPolygonFail(),
              messageActions.addMessage({ message: { type: ActionMessageType.ERROR, value: decorateError(e).error.message } })
            ])
          )
        }),
        catchError((e) => [
          mapToolsActions.getShapesByPolygonFail(),
          messageActions.addMessage({ message: { type: ActionMessageType.ERROR, value: decorateError(e).error.message } })
        ]))
    }),
  );
}
