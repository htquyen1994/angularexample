import { Injectable } from '@angular/core';
import { Subject, Observable, Subscription, merge, of } from 'rxjs';
import { OverlayShape, DrawingOverlay, ICONS, OverlayService, SelectionService, LayerService, LayerDataService } from '@client/app/shared';
import { OVERLAY_TYPE, OverlayShapeType, OverlayLabelType, ILayerColumnType } from '@client/app/shared/enums';
import { OverlayShapeGeometry, ILayer, IFilter } from '@client/app/shared/interfaces';
import { INearestShape, NearestToolPayload, NearestResultColumn } from '../interfaces';
import { map, debounceTime } from 'rxjs/operators';
import { TravelMode } from '@client/app/core/modules/view-management/enums';

@Injectable({
  providedIn: 'root'
})
export class NearestLogicService {
  private _overlay: DrawingOverlay;
  private _subscription: Subscription;

  public change$ = new Subject<void>();

  constructor(
    private _overlayService: OverlayService,
    private _selectionService: SelectionService,
    private _layerService: LayerService,
    private _layerDataService: LayerDataService,
  ) { }

  // public getNearest(layer: ILayer, filter: IFilter, pageSize: number = 10, sourcePoints: OverlayShapeGeometry[], mode: TravelMode): Observable<any[]> {
  //   return this._layerDataService.getNearestLayerData(layer, filter, pageSize, sourcePoints.map(e=> new google.maps.LatLng(e.coordinates[1], e.coordinates[0])), mode)
  // }

  public decorateData(_results: any[], filter: IFilter, layer: ILayer, payload: NearestToolPayload, originPoints: OverlayShapeGeometry[]) {
    const { displayColumns } = filter;
    const { mode, value } = payload;
    const items = _results.map((res, index) => {
      const { results } = res;
      const label = `${String.fromCharCode(97 + index).toUpperCase()}`;
      const filtered = results.sort((a: any, b: any) => {
        if (a['DistanceOrder'] > b['DistanceOrder']) {
          return 1;
        }
        if (a['DistanceOrder'] < b['DistanceOrder']) {
          return -1;
        }
        return 0;
      }).slice(0, value);
      const originPoint = {
        Geom: originPoints[index],
        _LABEL: label,
        isOrigin:  true
      }
      return [originPoint].concat(filtered.map((x: any, i) => {
        if (mode === TravelMode.CIRCLE) {
          return {
            ...x,
            _LABEL: `${label}${i + 1}`
          }
        }
        const time = x.Time.split(':');
        const s = parseInt(time[2], 10);
        const m = parseInt(time[1], 10);
        const h = parseInt(time[0], 10);
        const date = new Date()
        date.setHours(h);
        date.setMinutes(m);
        date.setSeconds(s);
        return {
          ...x,
          _LABEL: `${String.fromCharCode(97 + index).toUpperCase()}${i + 1}`,
          _DURATION: `${h ? h + 'h' : ''} ${m}m`,
          durationOrder: date.getTime()
        }
      }));
    })
    const results = items.reduce((a, b) => [...a, ...b]).sort((a: any, b: any) => {
      if (a['DistanceOrder'] > b['DistanceOrder']) {
        return 1;
      }
      if (a['DistanceOrder'] < b['DistanceOrder']) {
        return -1;
      }
      return 0;
    });

    const columns: NearestResultColumn[] = [{
      header: 'Label',
      id: '_LABEL',
      align: 'left',
      type: 'default',
      isPercentage: false,
      formatPipe: null,
      format: null
    }, {
      header: 'Distance',
      id: 'Distance',
      align: 'right',
      type: 'format',
      isPercentage: false,
      formatPipe: 'distance',
      format: null,
      orderBy: 'DistanceOrder'
    }];
    if (mode !== TravelMode.CIRCLE) {
      columns.push({
        header: 'Duration',
        id: '_DURATION',
        align: 'right',
        type: 'default',
        isPercentage: false,
        formatPipe: null,
        format: null,
        orderBy: 'durationOrder'
      })
    }
    const nearestResults = results.filter(e=>!e.isOrigin);
    columns.push(...displayColumns.map((columnId) => {
      const data = nearestResults[0];
      if (data[columnId] == undefined) {
        return null
      }
      const column = layer.columns.find(e => e.id === columnId);
      const { name, type, isPercentage, isIdentifier, format, isUrlFormatted } = column;
      let align = 'left';
      switch (column.type) {
        case ILayerColumnType.NUMBER:
        case ILayerColumnType.FLOAT:
          align = 'right';
          break;
      }
      let _format;
      let formatPipe;
      if (format) {
        formatPipe = format[0];
        _format = format.slice(1);
      } else if (type === ILayerColumnType.DATE) {
        formatPipe = 'date';
        _format = ['dd/MM/yyyy'];
      } else if (!isIdentifier) {
        if (isPercentage) {
          formatPipe = 'percent_100';
          _format = ['1.1-1'];
        } else if (isUrlFormatted) {
          formatPipe = 'innerHTML';
          _format = ['url'];
        } else if (type === ILayerColumnType.NUMBER) {
          formatPipe = 'number';
          _format = [];
        } else if (type === ILayerColumnType.FLOAT) {
          formatPipe = 'number';
          _format = ['1.1-2'];
        }
      }
      return {
        header: name,
        id: columnId,
        align,
        type: _format ? 'format' : 'default',
        isPercentage,
        formatPipe,
        format: _format
      }
    }))

    return {
      columns: columns.filter(e => !!e),
      results
    }
  }

  public getShape(shapeId: string){
    return this._overlay.getShape(shapeId);
  }

  public getAllShapes(){
    return this._overlay.getShapes()
  }

  public getShapes(): { requests: Observable<{ shapes: OverlayShapeGeometry[] }>[] } {
    const shapesObservables: Observable<OverlayShapeGeometry[]>[] = [];
    if (this._subscription) {
      this._subscription.unsubscribe();
      this._subscription = null;
    }
    this._selectionService.selectionStore.forEach((shapes, layerId) => {
      if (shapes.size > 0) {
        const layer = this._layerService.layerStore.get(layerId);
        if (layer) {
          // console.log(this.selectType, shapes, layerId);
          shapesObservables.push(
            this._layerDataService.getLayerDataGeomsForSelectedRecords({ ...layer }).pipe(
              map((x: any) => {
                return x.results.map(data => {
                  const geometry = data.geom || data.Geom;
                  if (geometry && geometry.type === OverlayShapeType[OverlayShapeType.Point]) {
                    return {
                      type: geometry.type,
                      coordinates: geometry.coordinates
                    };
                  }
                  return null
                }).filter(e => !!e);
              })
            )
          );
        } else {
          const overlay = this._overlayService.overlays.get(layerId);
          const collectedShapes = Array.from(shapes)
            .map(shapeId => {
              const shape: OverlayShape = overlay.shapes.get(shapeId);
              return shape && shape.type === OverlayShapeType.Point ? shape : null
            })
            .filter(shape => !!shape);
          this._subscription = merge(...collectedShapes.map(e => e.change)).pipe(
            debounceTime(500)
          ).subscribe(() => {
            this.change$.next();
          });

          shapesObservables.push(...collectedShapes.map(shape => of([{
            type: OverlayShapeType[shape.type],
            coordinates: shape.serializeGeometry()
          }])));
        }
      }
    });
    return {
      requests: shapesObservables.map(geometryObs => geometryObs.pipe(map(geometries => {
        return {
          shapes: geometries
        }
      })))
    };
  }

  public createShapes(shapes: INearestShape[]) {
    this._selectionService.clearLayerSelections(OVERLAY_TYPE.NEAREST);
    this.clearShapes();
    if (!this._overlay) {
      this._overlay = <DrawingOverlay>this._overlayService.overlays.get(OVERLAY_TYPE.NEAREST);
    }
    shapes.map(element => {
      return this.createShape(element)
    });
  }

  public clearShapes() {
    if(!this._overlay) {
      return;
    }
    this._overlay.deleteShapes();
  }

  private createShape(shape: INearestShape): OverlayShape {
    const { type, coordinates, label, fillColor, iconSize, zIndex } = shape;
    return this._overlay.addShapeByCoordinates(
      label,
      OverlayShapeType[type],
      coordinates,
      {
        icon: ICONS.PLACE,
        isLabel: true,
        isSelectable: true,
        labelStyle: label ? {
          id: '__LABEL',
          columnName: '__LABEL',
          name: '__LABEL',
        }: null,
        labelType: OverlayLabelType.CENTER,
        zIndex,
        iconSize,
        fillColor,
        transparency: 1,
        isVisible: true
      },
      {
        __LABEL: label
      }
    );
  }
}
