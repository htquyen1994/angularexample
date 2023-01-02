import { Injectable } from '@angular/core';
import {
  SelectionService,
  LayerService,
  LayerDataService,
  OverlayShape,
  OverlayService,
  UNITS,
  formatMetric,
  DrawingOverlay,
  IsogramService,
  MapService,
  H3_RESOLUTIONS,
  createSimpleError,
} from '@client/app/shared'
import { Observable, of, forkJoin, Subject, merge, Subscription, throwError } from 'rxjs';
import { OverlayShapeType, OVERLAY_TYPE } from '@client/app/shared/enums';
import { map, debounceTime, catchError } from 'rxjs/operators';
import { IInsightView } from '@client/app/core/modules/view-management/interface';
import { IInsightPolygonRequest, IInsightResult, IInsightPolygon } from '../interfaces';
import { IsogramRequest, OverlayShapeGeometry } from '@client/app/shared/interfaces';
import { InsightApiService } from './insight-api.service';
import { TravelMode, TravelType } from '@client/app/core/modules/view-management/enums';
import { ICatchmentView } from '../../core/modules';
import { TravelUnit } from '../../core/modules/view-management/enums';
import { MatchItLayerFilter, MatchItWeightColumn } from '@client/app/resultpanel/shared/models/match-it-filter.model';
import { decorateError } from '@client/app/shared/http.util';

@Injectable({
  providedIn: 'root'
})
export class InsightLogicService {

  private _overlay: DrawingOverlay;
  private polygonColors = ['#d7191c', '#e85b3a', '#f99e59', '#fec980', '#ffedaa'];
  private subscription: Subscription;

  public change$ = new Subject<void>();
  constructor(
    private _selectionService: SelectionService,
    private _layerService: LayerService,
    private _layerDataService: LayerDataService,
    private _overlayService: OverlayService,
    private _isogramService: IsogramService,
    private _insightApiService: InsightApiService,
    private _mapService: MapService
  ) {
  }

  public collectShapesAsObservable(view: IInsightView, isMetric: boolean): Observable<{ requests: IInsightPolygonRequest[], length: number }>[] {
    const shapesObservables: Observable<OverlayShapeGeometry[]>[] = [];
    if(this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this._selectionService.selectionStore.forEach((shapes, layerId) => {
      if (shapes.size > 0) {

        const layer = this._layerService.layerStore.get(layerId);
        if (layer) {
          // console.log(this.selectType, shapes, layerId);
          shapesObservables.push(
            this._layerDataService.getLayerDataGeomsForSelectedRecords({...layer}).pipe(
              map((x: any) => {
                return x.results.map(data => {
                  const geometry = data.geom || data.Geom;
                  return {
                    type: geometry.type,
                    coordinates: geometry.coordinates
                  };
                });
              })
            )
          );
        } else {
          const overlay = this._overlayService.overlays.get(layerId);
          const collectedShapes = Array.from(shapes)
            .map(shapeId => {
              const shape: OverlayShape = overlay.shapes.get(shapeId);
              return shape && shape.type !== OverlayShapeType.LineString ? shape : null
            })
            .filter(shape => !!shape);
          this.subscription = merge(...collectedShapes.map(e => e.change)).pipe(
            debounceTime(500)
          ).subscribe(() => {
            // Refire Insight when Shape is edited
            this.change$.next();
          });

          shapesObservables.push(...collectedShapes.map(shape => of([{
            type: OverlayShapeType[shape.type],
            coordinates: shape.serializeGeometry()
          }])));
        }
      }
    });
    return shapesObservables.map(geometryObs => geometryObs.pipe(
      map(geometries => {
        const requests = geometries.map(e => this.getPolygonsForShape(e, view, isMetric));
        return {
          length: geometries.length,
          requests: requests.length ? requests.reduce((a, b) => [...a, ...b]) : []
        }
      }),
      catchError(err=>{
        const error:any = err && err.error && err.error.data && !err.error.data.error ? createSimpleError("No road network available at this location."): decorateError(err) ;
        return throwError(error)
      })
    ));
  }

  public createInsightRequest(view: IInsightView,polygons: IInsightPolygonRequest[]): Observable<{polygons:IInsightPolygon[], insightRequest: Observable<{polygons: IInsightPolygon[], results: IInsightResult[]}>}>{
    return forkJoin(polygons.map(x => x.shape)).pipe(
      map((data: OverlayShapeGeometry[])=>{
        const _polygons = data.map((polygon,index)=>({
          ...polygon,
          label: polygons[index].label,
          type: OverlayShapeType[polygon.type] === OverlayShapeType.MultiPolygon
          ? OverlayShapeType[OverlayShapeType.MultiPolygon]
          : OverlayShapeType[OverlayShapeType.Polygon]
        }))


      const insightRequest = this._insightApiService.getInsightBatch(view, _polygons);
       return {
        polygons: _polygons,
        insightRequest
       }
      }),
    )
  }

  public createPolygons(polygons: IInsightPolygon[]){
    this.clearPolygons();
    if(!this._overlay){
      this._overlay = <DrawingOverlay>this._overlayService.overlays.get(OVERLAY_TYPE.INSIGHTS);
    }
    polygons.map((element, i) => {
      return this.createPolygon(i,element)
    });
  }

  public getShape(shapeId: string) {
    return this._overlay.getShape(shapeId);
  }

  public getAllShapes(){
    return this._overlay.getShapes()
  }

  public editLabelPolygon(index: number, label: string){
    if(!this._overlay){
       return;
    }
    const shape = this._overlay.getShape(index.toString())
    if(!shape){
      return;
    }

    shape.data['__LABEL'] = label;
    shape.setLabelStyle({
        id: '__LABEL',
        columnName: '__LABEL',
        name: '__LABEL'
      })
  }

  public clearPolygons() {
    if (!this._overlay) {
      return;
    }
    this._overlay.deleteShapes();
  }

  public onLocate(polygon: IInsightPolygon) {
    var bounds = new google.maps.LatLngBounds();
    polygon.coordinates[0].forEach((point: any) => {
      bounds = bounds.extend(new google.maps.LatLng(point[1], point[0]));
    });
    const center = bounds.getCenter();
    const level = this._mapService.map.getZoom();
    this._mapService.centreInViewportAtZoomLevel(level, { lat: center.lat(), lng: center.lng() });
  }

  public decorateFilter(layers: MatchItLayerFilter[], results: IInsightResult[], polygons: IInsightPolygon[]){
    if (!(layers && layers.length > 0)) {
      return null;
    }
    try {
      const densityValues = this._calculateDensity(layers, results, polygons);
      return {
        densityValues
      }
    } catch (error) {
      return null;
    }
  }

  private getPolygonsForShape(geometry: OverlayShapeGeometry, view: IInsightView, isMetric: boolean): IInsightPolygonRequest[] {
    let polygons: IInsightPolygonRequest[] = [];
    const catchments = view.catchments ? [...view.catchments] : [];
    if (OverlayShapeType[geometry.type] === OverlayShapeType.Point) {
      if (!(Array.isArray(catchments) && view.catchments.length > 0)) {
        catchments.push(
          {
            isDetail: true,
            mode: TravelMode.CIRCLE,
            toOrigin: false,
            type: TravelType.DISTANCE,
            value: 1,
            unit: isMetric ? TravelUnit.KILOMETER : TravelUnit.MILE
          } as ICatchmentView
        );
      }
      const { coordinates } = geometry;
      catchments.forEach((catchment, i) => {
        const { type, toOrigin, value, mode, isDetail, unit } = catchment
        const isDistance = type == TravelType.DISTANCE;
        const _value = isDistance ? unit === TravelUnit.KILOMETER ? value * UNITS.KILOMETER.constant: value * UNITS.MILE.constant : value;
        const label = isDistance
          ? formatMetric(_value, 1, isMetric, true)
          : `${catchment.value} minutes`;
        let shape$: Observable<OverlayShapeGeometry>;
        const center =  new google.maps.LatLng(coordinates[1], coordinates[0])
        if (catchment.mode === TravelMode.CIRCLE) {
          shape$ = this.getCircle(center, _value, i, this.polygonColors[i]);
        } else {
          const TravelValue = isDistance ? _value / 1000 : value;
          const model: IsogramRequest = {
            Origin: [center.lat(), center.lng()],
            TravelMode: mode,
            TravelValue,
            TravelType: isDistance ? 0 : 1,
            ReverseFlow: toOrigin,
            Complex: isDetail,
            Scenario:''
          };

          shape$ = this._isogramService
            .getIsogram(model)
            .pipe(
              map(data => ({ ...data, type: OverlayShapeType[data.type], index: i, color: this.polygonColors[i] })),
              catchError(err => {
                const error: any = err && err.error && err.error.data && !err.error.data.error ? createSimpleError("No road network available at this location.") : decorateError(err);
                return throwError(error)
              })
            );
        }
        polygons.push({
          label,
          shape: shape$
        });
      });
    } else {
      // const area = shape.getAreaSize();
      polygons = [
        {
          label: '', // area === null ? '' : formatMetric(area, 2, OverlayShape.isMetric),
          shape: of({...geometry, index: 0})
        }
      ];
    }

    return polygons;
  }

  private getCircle(
    center: google.maps.LatLng,
    radius: number,
    index,
    color
  ): Observable<OverlayShapeGeometry> {
    const numSides = 60;
    const points: number[][] = [];
    const degreeStep = 360 / numSides;

    for (let i = 0; i < numSides; i++) {
      const gpos = google.maps.geometry.spherical.computeOffset(
        center,
        radius,
        degreeStep * i
      );
      points.push([gpos.lng(), gpos.lat()]);
    }
    points.push([points[0][0], points[0][1]]);
    return of({
      type: OverlayShapeType[OverlayShapeType.Polygon],
      coordinates: [points],
      index,
      color
    });
  }

  private createPolygon(indexShape: number,shape: IInsightPolygon): OverlayShape {
    const { type, coordinates, color, label, index } = shape;
    const fillColor = color || "#BBBBBB"
    //console.log(fillColor);
    return this._overlay.addShapeByCoordinates(indexShape.toString(), OverlayShapeType[type], coordinates, {
      isActive: false,
      isSelected: false,
      isSelectable: true,
      isEditable: false,
      zIndex: 100 - index,
      fillColor,
      transparency: 0.5,
      isVisible: true,
      labelStyle: {
        id: '__LABEL',
        columnName: '__LABEL',
        name: '__LABEL'
      },
      isLabel: true,
    }, {
      __LABEL: label
    });
  }

  private _getResolution(areaKm2: number){
    const resolutions = H3_RESOLUTIONS.filter(e => e.resolution < 9).map(e => {
      return {
        ...e,
        result: Math.abs(e.areaKm2 - areaKm2)
      }
    })
    const resolution = resolutions.reduce((result, current) => {
      let res = result;
      if (result.result > current.result) {
        res = current;
      }
      return {
        ...res
      }
    })
    return {
      resolution
    }
  }

  private _calculateDensity(matchItLayerFilter: MatchItLayerFilter[], results: IInsightResult[], polygons: IInsightPolygon[]): any[] {
    return polygons.map(({ area }, index) => {
      const density: any = {}
      matchItLayerFilter.filter(e => e.matchItColumns && e.matchItColumns.length).forEach(_layer => {
        const { dataPackageId, matchItColumns } = _layer;
        const layerResult = results.find(_e => _e && _e.layer.id === dataPackageId);

        if (!layerResult) {
          return;
        }
        const { data, layer } = layerResult;
        const columnData = data.filter(col => col).map(col => col.children.map(col => { return { ...col, layerId: layerResult.layer.id } })).reduce((a, b) => {
          return [...a, ...b]
        })
        matchItColumns.forEach(column => {
          const { columnId, values } = column;
          const dataCol = columnData.find(col => col.layerId == dataPackageId && col.columnId == columnId)
          if (dataCol.values[index].list) {
            const keys = values.map(e=>e.key);
            dataCol.values[index].list.filter(item => !(item.count == null || item.count == undefined || !keys.includes(item.key))).forEach(val => {
              const { key, count } = val;
              this._setDensityValue(density, dataPackageId, columnId, count, area, key);
            });
          }else if(!(dataCol.values[index].count == null || dataCol.values[index].count == undefined)){
            const { count } = dataCol.values[index];
            this._setDensityValue(density, dataPackageId, columnId, count, area);
          }
        })
      })
      return Object.keys(density).length ? density : null
    }).filter(e=>!!e)
  }

  private _setDensityValue(density ,layerId, columnId, count: number, area: number, key?: string) {
    if (!density[layerId]) {
      density[layerId] = {};
    }
    if (key) {
      if (!density[layerId][columnId]) {
        density[layerId][columnId] = {};
      }
      density[layerId][columnId][key] = {
        count: count,
        area: area,
        density: count / area
      }
    } else {
      density[layerId][columnId] = {
        count: count,
        area: area,
        density: count / area
      };
    }
    return density;
  }
}
