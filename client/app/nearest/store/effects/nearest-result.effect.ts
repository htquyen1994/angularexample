import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { LayerStoreService, PanelStoreService } from '@client/app/core/services';
import { nearestResultActions } from '../actions';
import { switchMap, withLatestFrom, catchError, tap, takeUntil } from 'rxjs/operators';
import { NearestLogicService, NearestStoreService, NearestApiService } from '../../services';
import { forkJoin, of } from 'rxjs';
import { messageActions, panelActions, mapActions } from '@client/app/core/store/actions';
import { ActionMessageType, ILayerColumnType } from '@client/app/shared/enums';
import { createSimpleError, MapService, ZINDEX } from '@client/app/shared';
import { decorateError } from '@client/app/shared/http.util';
import { TabName } from '@client/app/shared/models/resultpanel.model';
import { resultPanelActions } from '@client/app/resultpanel/store/actions';
import { ResultPanelCollapseState } from '@client/app/core/enums';
import { TravelMode } from '@client/app/core/modules/view-management/enums';
import { INearestShape } from '../../interfaces';

@Injectable()
export class NearestResultEffects {
  constructor(
    private _actions$: Actions,
    private _layerStoreService: LayerStoreService,
    private _nearestApiService: NearestApiService,
    private _nearestLogicService: NearestLogicService,
    private _nearestStoreService: NearestStoreService,
    private _panelStoreService: PanelStoreService,
    private _mapService: MapService
  ) { }

  @Effect()
  getNearestResult$ = this._actions$.pipe(
    ofType(nearestResultActions.getNearestResult),
    withLatestFrom(
      this._nearestStoreService.filters$,
      this._layerStoreService.layers$,
      this._panelStoreService.resultPanelState$
    ),
    switchMap(([{ payload }, filters, layers, resultPanelState]) => {
      const { value, filterId, layerId, mode } = payload;
      const { requests } = this._nearestLogicService.getShapes();
      const layer = layers.find(e => e.id === layerId);
      if (!layer) {
        return [
          messageActions.addMessage({ message: { type: ActionMessageType.INFO, value: "Layer is not found." } }),
          nearestResultActions.getNearestResultFail({ error: createSimpleError("Layer is not found.") })
        ]
      }
      const filter = filters.find(e => e.id === filterId);
      if (!filter) {
        return [
          messageActions.addMessage({ message: { type: ActionMessageType.INFO, value: "filter is not found." } }),
          nearestResultActions.getNearestResultFail({ error: createSimpleError("filter is not found.") })
        ]
      }
      return forkJoin(requests).pipe(
        takeUntil(this._actions$.pipe(ofType(nearestResultActions.cancelGetNearestResult))),
        switchMap((responses) => {
          const _shapes = responses.map(e => e.shapes);
          const shapes = _shapes.length ? _shapes.reduce((a, b) => [...a, ...b]) : []
          if (!shapes.length) {
            return [
              messageActions.addMessage({ message: { type: ActionMessageType.INFO, value: "You have not selected any points on the map." } }),
              nearestResultActions.getNearestResultFail({ error: createSimpleError("You have not selected any points on the map.") })
            ]
          }
          if (shapes.length > 25) {
            return [
              messageActions.addMessage({ message: { type: ActionMessageType.INFO, value: "Please don't select more than 25 points for nearest." } }),
              nearestResultActions.getNearestResultFail({ error: createSimpleError("Please don't select more than 25 points for nearest.") })
            ]
          }

          // return [nearestResultActions.getNearestResultSuccess({shapes})]
          const sourcePoints = shapes.map(e => new google.maps.LatLng(e.coordinates[1], e.coordinates[0]))
          return this._nearestApiService.getNearest(layer, filter, value, sourcePoints, mode, this._mapService.map.getZoom().toString()).pipe(
            takeUntil(this._actions$.pipe(ofType(nearestResultActions.cancelGetNearestResult))),
            switchMap(_results => {
              const { results, columns } = this._nearestLogicService.decorateData(_results, filter, layer, payload, shapes)
              if (results && results.length) {
                const _shapes: INearestShape[] = results.map(e => {
                  const { Geom, _LABEL, isOrigin } = e;
                  if (isOrigin) {
                    return {
                      ...Geom,
                      label: undefined,
                      fillColor: '#3a4766',
                      iconSize: 20,
                      zIndex: ZINDEX.NEAREST + results.length
                    }
                  }
                  return {
                    ...Geom,
                    label: _LABEL,
                    fillColor: '#333333',
                    iconSize: 10,
                    zIndex: ZINDEX.NEAREST
                  }
                })
                this._nearestLogicService.createShapes(_shapes);
              }
              const nearestResults = results.filter(e => !e.isOrigin);
              const actions: any[] = [
                nearestResultActions.getNearestResultSuccess({ results: nearestResults, columns, payload }),
                resultPanelActions.setActiveTab({ id: TabName.NEAREST }),
                nearestResultActions.zoomAll()
              ]
              if (resultPanelState === ResultPanelCollapseState.CLOSE) {
                actions.push(panelActions.setResultPanelState({ id: ResultPanelCollapseState.HALF_SCREEN }))
              }
              return actions
            }),
            catchError(e => [
              messageActions.addMessage({ message: { type: ActionMessageType.ERROR, value: decorateError(e).error.message } }),
              nearestResultActions.getNearestResultFail({ error: decorateError(e) })
            ])
          );
        }),
        catchError(e => [
          messageActions.addMessage({ message: { type: ActionMessageType.ERROR, value: decorateError(e).error.message } }),
          nearestResultActions.getNearestResultFail({ error: decorateError(e) })
        ])
      )
    }),
  );

  @Effect({ dispatch: false })
  clearResult$ = this._actions$.pipe(
    ofType(nearestResultActions.clearResults),
    tap((_) => {
      this._nearestLogicService.clearShapes();
    }),
  );

  @Effect()
  downloadNearestResult$ = this._actions$.pipe(
    ofType(nearestResultActions.download),
    withLatestFrom(
      this._nearestStoreService.resultPayload$,
      this._nearestStoreService.results$,
      this._nearestStoreService.filters$,
      this._layerStoreService.layers$,
    ),
    switchMap(([_, payload, results, filters, layers]) => {
      try {
        const { value, filterId, layerId, mode } = payload;
        const layer = layers.find(e => e.id === layerId);
        const filter = filters.find(e => e.id === filterId);
        const { columns } = layer;
        const { displayColumns } = filter;
        const columnLabels = {};
        const headers = [...displayColumns]
        columns.forEach(column => {
          columnLabels[column.id] = column.name;
        });
        const _columns = displayColumns.map(columnId => columns.find(e => e.id === columnId));
        const _results = results.map(data => {
          const _data = [];
          _data.push(...[{
            type: null,
            value: `${data['_LABEL']}`
          }, {
            type: ILayerColumnType.DISTANCE,
            value: Number.parseFloat(data.Distance) * 1000 // km to m
          }]);
          if (mode !== TravelMode.CIRCLE) {
            _data.push({
              type: null,
              value: `${data['_DURATION']}`
            });
          }
          _columns.forEach(column => {
            _data.push({
              type: column.isIdentifier ? null : column.type,
              value: data[column.id]
            })
          })
          return _data
        })
        return this._nearestApiService.download({ columnLabels, results: _results, headers, isStraightLine: mode === TravelMode.CIRCLE }).pipe(
          switchMap(() => [
            messageActions.addMessage({ message: { type: ActionMessageType.SUCCESS, value: 'Download successful' } }),
            nearestResultActions.downloadSuccess()
          ]),
          catchError((e) => [
            messageActions.addMessage({
              message: {
                type: ActionMessageType.ERROR,
                value: 'Download fail!'
              }
            }),
            nearestResultActions.downloadFail({ error: decorateError(e) })
          ])
        )
      } catch {
        return [
          messageActions.addMessage({
            message: {
              type: ActionMessageType.ERROR,
              value: 'Download fail!'
            }
          }),
          nearestResultActions.downloadFail({ error: createSimpleError('Download fail!') })
        ]
      }
    }),
  );

  @Effect()
  zoomToFeature$ = this._actions$.pipe(
    ofType(nearestResultActions.zoomToFeature),
    switchMap(({ shapeId }) => {
      const shape = this._nearestLogicService.getShape(shapeId);
      return [mapActions.zoomTo({ locations: [shape.getCenter()] })]
    }),
  );

  @Effect()
  zoomAllFeatures$ = this._actions$.pipe(
    ofType(nearestResultActions.zoomAll),
    switchMap((_) => {
      const locations = this._nearestLogicService.getAllShapes().map(e => e.getCenter());
      return [mapActions.zoomTo({ locations })]
    }),
  );
}
