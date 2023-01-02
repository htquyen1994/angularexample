import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, forkJoin } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { MapService } from './map.service';
import { MapToolType } from './enums'
import { OverlayShapeRectangle, OverlayShapePolygon, OverlayShape, OverlayShapeLine } from './overlay-shape';
import { COLORS, ZINDEX } from './global';
import { ISelection, IActiveShape, IRectangleSelection } from './interfaces';
import { LayerService } from './layer.service';


@Injectable()
export class SelectionService {

    selectionStore = new Map<string, Set<string>>();
    selectionSource = new Subject<ISelection>();
    selection = this.selectionSource.asObservable().pipe(shareReplay(1));
    // selectionStore$ = this.selection.asObservable().pipe(shareReplay(1));

    activeStore: IActiveShape = null;
    activeSource = new Subject<ISelection>();
    active = this.activeSource.asObservable();

    rectangleSource = new Subject<IRectangleSelection>();
    rectangle = this.rectangleSource.asObservable();

    polygonSource = new Subject<google.maps.Polygon>();
    polygon = this.polygonSource.asObservable();

    splitSource = new Subject<google.maps.Polyline>();
    split = this.splitSource.asObservable();

    activeToolStore: MapToolType = null;
    activeToolSource = new Subject<MapToolType>();
    activeTool = this.activeToolSource.asObservable();

    deleteAllShapes$ = new Subject<boolean>();

    isogramSource = new Subject<google.maps.LatLng>();
    isogram = this.isogramSource.asObservable();

    isogramQISource = new Subject<google.maps.LatLng>();
    isogramQI = this.isogramQISource.asObservable();

    openRowSource = new Subject<{ shapeId: any, layerId: string }>();
    openRow$ = this.openRowSource.asObservable();

    shapeSource = new Subject<OverlayShape>();
    shape = this.shapeSource.asObservable();

    mapClickSource = new Subject<{latLng: google.maps.LatLng}>();
    mapClick$ = this.mapClickSource.asObservable();

    private drawingManager: google.maps.drawing.DrawingManager;

    constructor(private mapService: MapService, private layerService: LayerService, private _ngZone: NgZone) {

        this.mapService.mapRx.subscribe((map: google.maps.Map) => {
            this.initSelectionTool(map);
        });
    }

    deleteAllShapes() {
        this.deleteAllShapes$.next(null);
    }

  changeSelection(selection: ISelection) {
    const { isAdd, shapeIds, overlayId, shapeId } = selection;
    if (!this.selectionStore.has(overlayId)) {
      this.selectionStore.set(overlayId, new Set<string>());
    }
    this._ngZone.run(() => {
      if (shapeIds && shapeIds.length) {
        this.selectMultiShapes(overlayId, shapeIds, isAdd);
      } else if (shapeId) {
        this.selectShape(overlayId, shapeId, isAdd);
      }
      this.selectionSource.next(selection)
    })
  }

  selectMultiShapes(overlayId: string, shapeIds: string[], isAdd: boolean) {
    const selectionStore = this.selectionStore.get(overlayId);
    if (isAdd) {
      shapeIds.forEach(id => {
        selectionStore.add(id);
      })
    } else {
      shapeIds.forEach(id => {
        selectionStore.delete(id);
      })
    }
  }

  selectShape(overlayId: string, shapeId: string, isAdd: boolean) {
    const selectionStore = this.selectionStore.get(overlayId);
    if (isAdd) {
      this.setActive(overlayId, shapeId);
      selectionStore.add(shapeId);
    } else {
      this.removeActive();
      selectionStore.delete(shapeId);
    }
  }

    clearLayerSelections(layerId: string) {
        const overlay = this.selectionStore.get(layerId);
        if (overlay) {
            overlay.forEach(shapeId => {
                this.changeSelection({
                    isAdd: false,
                    overlayId: layerId,
                    shapeId: shapeId
                });
            });
        }
    }

    isSelected(overlayId: string, shapeId: string) {
        return this.selectionStore.get(overlayId) ? this.selectionStore.get(overlayId).has(shapeId) : false;
    }

    removeActive() {
        const active = this.activeStore;
        this.activeStore = null;
        if (active) {
            this.activeSource.next({
                isAdd: false,
                overlayId: active.overlayId,
                shapeId: active.shapeId
            });
        }
    }

    setActive(overlayId: string, shapeId: string) {
        if(this.isActive(overlayId, shapeId)){
            return;
        }
        this.removeActive();

        this.activeStore = {
            overlayId: overlayId,
            shapeId: shapeId
        };

        this.activeSource.next({
            isAdd: true,
            overlayId: overlayId,
            shapeId: shapeId
        });
    }

    isActive(overlayId: string, shapeId: string) {
        return this.activeStore && this.activeStore.overlayId === overlayId && this.activeStore.shapeId === shapeId;
    }

    getLayerActiveShapeId(overlayId: string) {
        return this.activeStore && this.activeStore.overlayId === overlayId ? this.activeStore.shapeId : null;
    }

    setTool(mapTool: MapToolType) {
        this.activeToolStore = mapTool;
        this.activeToolSource.next(mapTool);
    }

    setToolSelection(mapTool: MapToolType) {
        this.activeToolStore = mapTool;

        switch (mapTool) {
            case MapToolType.SELECTION_ADD:
            case MapToolType.SELECTION_REMOVE:
                this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
                break;
            case MapToolType.SELECTION_POLYGON:
                this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                break;
            case MapToolType.SHAPE_SPLIT:
                this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
                break;
            case MapToolType.SELECTION_REMOVE_ALL:
                this.selectionStore.forEach((_, layerId) => this.clearLayerSelections(layerId));
                setTimeout(() => this.activeToolSource.next(MapToolType.SELECTION), 500);
                break;
            case MapToolType.LOCATE_ALL_SHAPES:
                this.drawingManager.setDrawingMode(null);
                const boundObservables: Observable<any>[] = [];
                this.selectionStore.forEach((shapeIds, layerId) => {
                    if (shapeIds.size > 0 && !layerId.startsWith('__')) {
                      boundObservables.push(this.layerService.getSelectedBounds(layerId, Array.from(shapeIds)));
                    } else if (layerId === '__DRAW') {
                      boundObservables.push(this.mapService.getDrawingBounds(shapeIds));
                    }
                });

                if (boundObservables.length > 0) {
                    forkJoin(boundObservables).subscribe(x => {
                        const boundsUnion = new google.maps.LatLngBounds();

                        x.forEach(y => {
                            const bound = new google.maps.LatLngBounds();

                            y.results.coordinates[0].forEach(point => {
                                bound.extend({
                                    lat: point[1],
                                    lng: point[0]
                                });
                            });
                            boundsUnion.union(bound);
                        });

                        this.mapService.zoomBounds(boundsUnion);
                        this.mapService.map.setZoom(this.mapService.map.getZoom() - 1);
                    });
                }
                setTimeout(() => this.activeToolSource.next(MapToolType.SELECTION), 500);
                break;
            default:
              this.drawingManager.setDrawingMode(null);
        }
    }

    initSelectionTool(map: google.maps.Map) {
        this.drawingManager = new google.maps.drawing.DrawingManager({
            map: map,
            drawingMode: null,
            drawingControl: false,
            rectangleOptions: OverlayShapeRectangle.getDefaultOptions({
                fillColor: COLORS.MAP_SELECTION,
                strokeColor: COLORS.MAP_SELECTION_STROKE,
                strokeWeight: 1,
                zIndex: ZINDEX.SELECTION,
                transparency: 0.2
            }),
            polylineOptions: OverlayShapeLine.getDefaultOptions({
                strokeColor: COLORS.MAP_SELECTION_STROKE,
                strokeWeight: 2,
                zIndex: ZINDEX.SELECTION,
                transparency: 1
            }),
            polygonOptions: OverlayShapePolygon.getDefaultOptions({
                fillColor: COLORS.MAP_SELECTION,
                strokeColor: COLORS.MAP_SELECTION_STROKE,
                strokeWeight: 3,
                zIndex: ZINDEX.SELECTION,
                transparency: 0.4
            })
        });

        this.drawingManager.addListener('polygoncomplete', (shapeRef: google.maps.Polygon) => {
            setTimeout(() => {
                shapeRef.setMap(null);
            }, 500);

            this.drawingManager.setDrawingMode(null);
            this.polygonSource.next(shapeRef);
            this.activeToolSource.next(MapToolType.SELECTION);
        });

        this.drawingManager.addListener('rectanglecomplete', (shapeRef: google.maps.Rectangle) => {
            shapeRef.setMap(null);
            this.drawingManager.setDrawingMode(null);
            this.rectangleSource.next({
                isAdd: this.activeToolStore === MapToolType.SELECTION_ADD,
                bounds: shapeRef.getBounds()
            });
            this.activeToolSource.next(MapToolType.SELECTION);
        });

        this.drawingManager.addListener('polylinecomplete', (shapeRef: google.maps.Polyline) => {
            shapeRef.setMap(null);
            this.drawingManager.setDrawingMode(null);
            this.splitSource.next(shapeRef);
            this.activeToolSource.next(MapToolType.SELECTION);
        });
    }

    deselectLayer(layerId: string) {
        if (this.selectionStore.get(layerId)) {
            this.selectionStore.get(layerId).forEach(shapeId => {
                this.changeSelection({
                    isAdd: false,
                    overlayId: layerId,
                    shapeId: shapeId
                });
            });
        }
    }

    openRow(layerId: string, shapeId: any) {
        this.changeSelection({
            isAdd: true,
            overlayId: layerId,
            shapeId
        })
        this.openRowSource.next({ layerId, shapeId });
    }
}
