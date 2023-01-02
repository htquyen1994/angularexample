import { Injectable } from '@angular/core';
import { LayerDataService, LayerService, OverlayService, OverlayShape, createSimpleError } from '@client/app/shared';
import { OverlayShapeGeometry, IFilter, ISelection } from '@client/app/shared/interfaces';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { OVERLAY_TYPE, OverlayShapeType } from '@client/app/shared/enums';

@Injectable({
  providedIn: 'root'
})
export class MapToolLogicService {

  constructor(
    private _layerDataService: LayerDataService,
    private _layerService: LayerService,
    private _overlayService: OverlayService,
  ) { }

  getRecordsByPolygonInLayer(overlayId: string, polygon: OverlayShapeGeometry): Observable<ISelection>{
    const layer = this._layerService.getLayer(overlayId);
    if(!layer){
      return throwError(createSimpleError(`Could not find layer ${overlayId}`));
    }
    const idColumn = layer.columns.find(e=>e.isIdentifier);
    if(!idColumn){
      return throwError(createSimpleError(`Could not find identify column layer ${overlayId}`));
    }
    const filter: IFilter = {
      id: null,
      displayColumns: [idColumn.id],
      filters: {},
      isDefault: false,
      name: 'map tool selection',
      shape: {
        operator: 'SpatialBinaryOperator.Intersects',
        value: polygon
      },
      sortColumn: idColumn.id,
      sortDirection: "ASC"
    }

    const query = this._layerDataService.buildQueryRequest(layer, filter, false, false, 0, 999999, idColumn.id, true, false);
    return this._layerDataService.getLayerDataOrigin(layer, query).pipe(
      map(e=> {
        const {results} = e;
        const shapeIds = results.map(record=> record[idColumn.id].toString());
        return {
          isAdd: true,
          overlayId: layer.id,
          shapeId:null,
          shapeIds
        } as ISelection
      })
    );
  }

  getShapeDetail(overlayId: string, shapeId: string): Observable<OverlayShapeGeometry>{
    const idDrawingLayers = overlayId.startsWith('__');
    if(idDrawingLayers){
      const overlayShape: OverlayShape = this._overlayService.overlays.get(overlayId).shapes.get(shapeId);
      const coordinates = overlayShape.serializeGeometry();
      const shape: OverlayShapeGeometry = {
        coordinates,
        type: OverlayShapeType[OverlayShapeType.Polygon]
      }
      return of(shape)
    }
    const layer = this._layerService.getLayer(overlayId);
    return this._layerDataService.getRecordDetail(layer, shapeId).pipe(
      switchMap(x=>{
        if(x && x.detail){
          const geometry = x.detail.geom || x.detail.Geom;
          return of(geometry)
         }
        return throwError(createSimpleError('Can not get geometry of shape'))
      })
    )
  }
}
