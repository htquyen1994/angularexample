import { debounceTime, first, take, map, count, distinctUntilChanged } from 'rxjs/operators';
import { Injectable, NgZone, ChangeDetectorRef } from '@angular/core';
import { ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { LayerService } from './layer.service';
import { MapService } from './map.service';
import { HttpService } from './http.service';
import { DrawingOverlay } from './overlay/drawing-overlay';
import { OverlayAbstract, OverlayDataItem } from './overlay/overlay-abstact';
import { SelectionService } from './selection.service';
import { OverlayShape, OverlayShapePoint } from './overlay-shape';
import { LayerDataService } from './layer-data.service';
import { AccountService } from './account.service';
import { FilterService } from './filter.service';
import { LayerStyleService } from './layer-style.service';
import { ISchema } from './Data/Packaging';
import { IFeature, IGeometry, getTiles, GeoJsonFeature, getBoundingBox } from './map-utils/shapes';
import { ActionMessageService } from './action-message.service';
import { OverlayShapeStatic } from './models/overlay-shape-static';
import { OverlayShapeClass, LayerType } from './enums';
import { IAccount, ILayer, FilterChange, ISelection, IRectangleSelection, ILabelStyleChange, IJsonTile, ILayerStyleChange } from './interfaces';
import {
  Operator, NullabilityPredicate, BinaryPredicate,
  Junction, JunctionOperator, PropertyExpression,
  SpatialBinaryPredicate, IPredicate, ConstantCollectionExpression,
  ConstantExpression, IExpression
} from './QueryModel';
import { LayerStyleType, ClusterType } from './models/layer-style.model';
import { WorkerMapProcessingService } from './services/worker-map-processing.service';
import { IUpdateOverlayRespone } from '../../../client_webworker/app-workers/shared/models/worker-message.model';
import { WORKER_ACTION_UPDATE_OVERLAY, INVALIDCACHETYPE } from '../../../client_webworker/app-workers/shared/models/worker-topic.constants';
import { TileOverlayAbstract, IOverlayTile, IOverlaySubscription } from './models/overlay-new/tile-overlay-abstract';
import { HeatmapOverlay } from './models/overlay-new/heatmap-overlay';
import { TileOverlay } from './models/overlay-new/tile-overlay';
import { ClusterOverlay } from './models/overlay-new/cluster-overlay';
import { createSimpleError, decorateError } from './http.util';
import { LabelgunService } from './services/labelgun.service';
import { IS_MORRISON } from './global';
import { LabelService } from './services/label.service';
import { WorkerService } from './worker.service';
import { LayerStyle, LayerStyleCluster } from './layer-style';


@Injectable()
export class OverlayService {

  activeSource = new Subject<OverlayAbstract<any>>();
  active = this.activeSource.asObservable();

  // labelStore: { [overlayId: string]: string } = {};
  // labelSource = new Subject<ILabelChange>();
  // label = this.labelSource.asObservable().pipe(map((data: ILabelChange) => {
  //     const overlay = this.overlays.get(data.overlayId);
  //     if (overlay) {
  //         if (overlay instanceof TileOverlay) {
  //             let flag = true;
  //             if (data.columnId) {
  //                 if (this.checkShapesSize(overlay)) {
  //                     flag = false;
  //                     this.actionMessageService.sendInfo('Too many features to label at this map scale, please zoom in and try again.')
  //                 }
  //             }
  //             if (flag) {
  //                 return data;
  //             }
  //         }
  //     } else {
  //         return data;
  //     }

  //     return { ...data, columnId: null };
  // }));

  loadingSource = new Subject<number>();
  loading = this.loadingSource.asObservable().pipe(distinctUntilChanged());
  timerSource = new Subject<number>();
  timer = this.timerSource.asObservable();

  overlays = new Map<string, OverlayAbstract<any>>();

  subscriptionUpdateOverlays = new Map<string, IOverlaySubscription>();
  shapeSettimeout: {
    id: string,
    setTimeouts: any[];
    setTimeoutsUpdatedShape: any[]
  }[] = [];
  cancelSettimeout = new Subject<any>();
  totalLoading = 0;
  finishedLoading = 0;
  get workerLoading() {
    if (!this._workerLoading.size) return 1;
    return Array.from(this._workerLoading.values()).reduce((pre, curr, currIndex, arr) => pre + curr) / this._workerLoading.size;
  }
  _workerLoading: Map<string, number> = new Map<string, number>();
  showSelectedOnly: boolean = false;
  _timer: number;
  constructor(private layerService: LayerService,
    public selectionService: SelectionService,
    private filterService: FilterService,
    private accountService: AccountService,
    public ngZone: NgZone,
    private mapService: MapService,
    private layerStyleService: LayerStyleService,
    public layerDataService: LayerDataService,
    public actionMessageService: ActionMessageService,
    public httpService: HttpService,
    // public workerMapProcessingService: WorkerMapProcessingService,
    private workerService: WorkerService,
    public labelgunService: LabelgunService,
    private labelService: LabelService
  ) {
    OverlayShapeStatic.selectionService = this.selectionService;
    OverlayShapeStatic.overlayService = this;
    OverlayShapeStatic.actionMessageService = this.actionMessageService;
    OverlayShapeStatic.labelgunService = this.labelgunService;
    this.mapService.overlayService = this;

    this.mapService.overlaymapBounds.subscribe(() => {
      this.stopRenderShapes();
      this.overlays.forEach(overlay => {
        if (overlay instanceof TileOverlayAbstract) {
          // this.cancelSettimeout.next(overlay.id);
          this.updateOverlay(overlay, overlay instanceof HeatmapOverlay || overlay instanceof ClusterOverlay);
        }
      });
    });

    this.mapService.overlayZoom.subscribe(({ currentZoom, previousZoom }) => {
      this.stopRenderShapes();
      Array.from(this.overlays.values()).forEach(overlay => {
        if (overlay instanceof TileOverlay) {
          const labelStyle = this.labelService.getActiveStyleByLayerId(overlay.id);
          if (labelStyle && labelStyle.enableScaleRange) {
            const { rangeScale } = labelStyle;
            const currentCheck = rangeScale[0] > currentZoom || rangeScale[1] < currentZoom;
            const previousCheck = rangeScale[0] > previousZoom || rangeScale[1] < previousZoom;
            if (currentCheck != previousCheck) {
              this.updateLabelStyle(overlay, currentCheck ? null : labelStyle)
            } else {
              this.checkEnableLabelgun(overlay);
            }
          } else if (labelStyle) {
            this.checkEnableLabelgun(overlay);
          }
        }
        if (overlay instanceof DrawingOverlay) {
          this.checkEnableLabelgun(overlay);
        }
      });
    });

    this.mapService.mapDragStart$.subscribe(() => {
      this.stopRenderShapes();
    })

    this.labelService.styleChange.pipe(
      map((data: ILabelStyleChange) => {
        const overlay = this.overlays.get(data.overlayId);
        if (overlay) {
          if (overlay instanceof TileOverlay) {
            if (data.style) {
              if (this.checkShapesSize(overlay)) {
                this.labelService.setActiveStyleByLayerId(overlay.id, null)
                this.actionMessageService.sendInfo('Viewing this many labels at once could cause slow performance. Please zoom in, or setup a scale range in the label style.')
                return null;
              }
            }
            return data;
          }
        } else {
          return null;
        }
        return null;
      })
    ).subscribe((data: ILabelStyleChange) => {
      if (!data) return;
      const overlay = this.overlays.get(data.overlayId);
      if (overlay instanceof TileOverlay) {
        const zoom = this.mapService.map.getZoom();
        const style = this.labelService.getActiveStyleByLayerIdForRendering(overlay.id, zoom);
        overlay.updateLabelStyle_async(style, () => {
          if (!IS_MORRISON) {
            this.enableLabelgun();
          }
        })
      }
    })

    this.layerService.layerSelected.subscribe((layer: ILayer) => {
      if (layer.isSelected) {
        if (!this.overlays.get(layer.id)) {
          const style = this.layerStyleService.getActiveStyle(layer.id);
          if (!style) {
            return;
          }
          let overlay: TileOverlayAbstract<any> = null;
          if (style.type === LayerStyleType.HEATMAP) {
            overlay = new HeatmapOverlay(layer.id, layer, this.mapService.map, style);
          } else if (style.type === LayerStyleType.CLUSTER) {
            overlay = new ClusterOverlay(layer.id, layer, this.mapService.map, style.clone());
          } else {
            overlay = new TileOverlay(layer.id, layer, this.layerStyleService, this.selectionService, style);
          }
          this.overlays.set(layer.id, overlay);
          this.updateOverlay(<TileOverlayAbstract<any>>this.overlays.get(layer.id));
        }
      } else {
        this.deleteOverlay(this.overlays.get(layer.id));
      }
    });

    this.filterService.filter.pipe(
      debounceTime(50)
    ).subscribe((filterChange: FilterChange) => {
      // this.cancelSettimeout.next(filterChange.layerId);
      this.stopRenderOverlayShapes(filterChange.layerId);
      if (this.overlays.get(filterChange.layerId)) {
        this.updateOverlay(<TileOverlayAbstract<any>>this.overlays.get(filterChange.layerId), false);

        if (this.overlays.get('__FILTER').hasShape(filterChange.layerId)) {
          this.overlays.get('__FILTER').deleteShape(filterChange.layerId);
        }
      }
    });

    this.layerStyleService.styleChange.pipe(
      debounceTime(50)
    ).subscribe((change: ILayerStyleChange) => {
      const { layerId } = change;
      const overlay = <TileOverlayAbstract<any>>this.overlays.get(layerId);
      if (!overlay) {
        return;
      }
      const style = this.layerStyleService.getActiveStyle(layerId);
      if (!style) {
        this.deleteOverlay(overlay);
        return;
      }
      switch (style.type) {
        case LayerStyleType.HEATMAP:
          if (overlay instanceof HeatmapOverlay) {
            const { columnName } = overlay.style.opts;
            if (columnName != style.opts.columnName) {
              overlay.style = style.clone();
              this.updateOverlay(overlay, true);
            } else {
              overlay.setStyle(<LayerStyleCluster>style);
            }
            overlay.setStyle(style);
          } else {
            this.replaceWithHeatmapOverlay(overlay, style);
          }
          break;
        case LayerStyleType.CLUSTER:
          if (overlay instanceof ClusterOverlay) {
            const { mapType, columnName } = overlay.style.opts;
            if (columnName != style.opts.columnName) {
              overlay.style = style.clone();
              this.updateOverlay(overlay, true);
            } else if (mapType != style.opts.mapType) {
              overlay.style = style.clone();
              this.updateOverlay(overlay, false);
            } else {
              overlay.setStyle(<LayerStyleCluster>style);
            }
          } else {
            this.replaceWithClusterOverlay(overlay, style);
          }
          break;
        default:
          if (overlay instanceof TileOverlay) {
            this.totalLoading = this.totalLoading - this.finishedLoading;
            this.finishedLoading = 0;
            // overlay.setStyle(style);
            const loopCount = overlay.setStyle_async(style, () => {
              this.addFinishedLoading(10);
            });
            this.addTotalLoading(loopCount * 10);
          } else {
            this.replaceWithTileOverlay(overlay, style);
          }
          break;
      }
    });

    this.selectionService.active.subscribe((selection: ISelection) => {
      const overlay = this.overlays.get(selection.overlayId);
      if (!overlay) {
        return null;
      }

      const shape = overlay.getShape(selection.shapeId);
      if (shape instanceof OverlayShape && selection.isAdd === false) {
        shape.update({
          isActive: false,
          isSelected: this.selectionService.isSelected(selection.overlayId, selection.shapeId)
        });
      }
    });

    this.selectionService.selection.subscribe((selection: ISelection) => {
      const { overlayId, shapeIds, shapeId, isAdd } = selection;
      const overlay = this.overlays.get(overlayId);
      if (!overlay) {
        return null;
      }
      if(shapeIds && shapeIds.length){
        shapeIds.forEach(shapeId=>{
          const shape = overlay.getShape(shapeId);
          if (shape instanceof OverlayShape) {
            shape.update({
              isActive: this.selectionService.isActive(overlayId, shapeId),
              isSelected: isAdd
            });
          }
        })
      } else if(shapeId){
        const shape = overlay.getShape(shapeId);
        if (shape instanceof OverlayShape) {
          shape.update({
            isActive: this.selectionService.isActive(overlayId, shapeId),
            isSelected: isAdd
          });
        }
      }

      if (this.showSelectedOnly) {
        this.mapService.onToggleShowSelectedOnly(this.showSelectedOnly);
      }
    });

    this.selectionService.rectangle.subscribe((next: IRectangleSelection) => {
      this.overlays.forEach((overlay) => {
        if ((overlay.id.startsWith('__') && overlay.id !== '__FILTER') ||
          (this.layerService.layerActiveStore && overlay.id === this.layerService.layerActiveStore.id)) {
          overlay.allShapes((shape: OverlayShapePoint) => {
            if (shape instanceof OverlayShape && shape.contains(next.bounds)) {
              this.selectionService.changeSelection({
                isAdd: next.isAdd,
                overlayId: overlay.id,
                shapeId: shape.id
              });
            }
          });
        }
      });
    });

    this.selectionService.polygon.subscribe((geometry: google.maps.Polygon) => {
      this.overlays.forEach((overlay) => {
        if ((overlay.id.startsWith('__') && overlay.id !== '__FILTER') ||
          (this.layerService.layerActiveStore && overlay.id === this.layerService.layerActiveStore.id)) {
          overlay.allShapes((shape: OverlayShape) => {
            if (shape instanceof OverlayShape && shape.containsPolygon(geometry)) {
              this.selectionService.changeSelection({
                isAdd: true,
                overlayId: overlay.id,
                shapeId: shape.id
              });
            }
          });
        }
      });
    });

    this.accountService.account.subscribe((account: IAccount) => {
      if (OverlayShapeStatic.isMetric == account.isMetric) return;
      OverlayShapeStatic.isMetric = account.isMetric;
      this.overlays.forEach((overlay) => {
        if (overlay instanceof TileOverlay) {
          overlay.allShapes((shape: OverlayShapePoint) => {
            shape.updateMeasurement();
          });
        }
      });
    });

    this.mapService.mapRx.subscribe(map => OverlayShapeStatic.map = map);

    this.loading.pipe(debounceTime(500)).subscribe(progress => {
      if (progress === 1) {
        // this.overlays.forEach(overlay => {
        //   if (overlay instanceof ClusterOverlay) {
        //     overlay.redraw();
        //   }
        // });
        this.enableLabelgun();
        this.unSubscriptionTimer();
      }
    })
    this.cancelSettimeout.subscribe(id => {
      let shapeSettimeoutIndex = this.shapeSettimeout.findIndex(e => e.id == id);
      if (shapeSettimeoutIndex != -1) {
        // console.log("settimeout", this.shapeSettimeout[shapeSettimeoutIndex].settimeouts)
        this.shapeSettimeout[shapeSettimeoutIndex].setTimeouts.forEach(e => {
          clearTimeout(e);
        })
        this.shapeSettimeout[shapeSettimeoutIndex].setTimeoutsUpdatedShape.forEach(e => {
          clearTimeout(e);
        })
        this.addFinishedLoading(this.shapeSettimeout[shapeSettimeoutIndex].setTimeouts.length);
        this.shapeSettimeout[shapeSettimeoutIndex].setTimeouts = [];
        this.shapeSettimeout[shapeSettimeoutIndex].setTimeoutsUpdatedShape = [];
      }
    })

    this.mapService.showSelectedOnly.pipe(debounceTime(500)).subscribe(value => {
      this.showSelectedOnly = value;
      this.stopRenderShapes(true);
      this.overlays.forEach(overlay => {
        if (overlay instanceof TileOverlayAbstract) {
          // this.cancelSettimeout.next(overlay.id);
          this.updateOverlay(overlay, true);
        }
      });
    })
  }

  updateOverlayByLayerId(layerId, updateAll = false) {
    const overlay = this.overlays.get(layerId);
    if (overlay && overlay instanceof TileOverlayAbstract) {
      this.updateOverlay(overlay, overlay instanceof HeatmapOverlay || overlay instanceof ClusterOverlay || updateAll);
    }
  }

  replaceOverlay(current: TileOverlayAbstract<any>, next: TileOverlayAbstract<any>) {
    // this.cancelSettimeout.next(current.id);
    this.stopRenderOverlayShapes(current.id, true);
    this.deleteOverlayInMainThread(current)
    this.overlays.set(current.id, next);
    this.updateOverlay(next, true);
  }

  replaceWithTileOverlay(overlay: TileOverlayAbstract<any>, style: LayerStyle) {
    this.replaceOverlay(
      overlay,
      new TileOverlay(
        overlay.layer.id,
        overlay.layer,
        this.layerStyleService,
        this.selectionService,
        style));
  }

  replaceWithHeatmapOverlay(overlay: TileOverlayAbstract<any>, style: LayerStyle) {
    this.replaceOverlay(
      overlay,
      new HeatmapOverlay(
        overlay.layer.id,
        overlay.layer,
        this.mapService.map,
        style));
  }

  replaceWithClusterOverlay(overlay: TileOverlayAbstract<any>, style: LayerStyle) {
    this.replaceOverlay(
      overlay,
      new ClusterOverlay(
        overlay.layer.id,
        overlay.layer,
        this.mapService.map,
        style.clone()));
  }

  createOverlay(overlayId: string): DrawingOverlay {
    const overlay = new DrawingOverlay(overlayId, OverlayShapeClass.DRAWING);
    this.overlays.set(overlayId, overlay);
    return overlay;
  }

  deleteOverlay(overlay: OverlayAbstract<any>) {
    if (overlay) {
      this.stopRenderOverlayShapes(overlay.id, true);
      if (overlay instanceof HeatmapOverlay) {
        overlay.hideHeatMap();
      }
      this.ngZone.runOutsideAngular(() => {
        overlay.clear();
      })
      this.overlays.delete(overlay.id);
      this.totalLoading++;
      this.finishedLoading++;
      this.calculateLoading();
    }
  }

  deleteOverlayInMainThread(overlay: OverlayAbstract<any>) {
    if (overlay) {
      if (overlay instanceof HeatmapOverlay) {
        overlay.hideHeatMap();
      }
      this.ngZone.runOutsideAngular(() => {
        overlay.clear();
      })
      this.overlays.delete(overlay.id);
      this.calculateLoading();
    }
  }

  invalidateAll(overlay: TileOverlayAbstract<any>) {
    this.workerService.invalidateAndUpdate(INVALIDCACHETYPE.All, overlay.id, null)
    this.updateOverlay(overlay, true);
  }

  invalidateAndUpdate(overlay: TileOverlayAbstract<any>, invalidated: { Prefixes: string[], Tiles: string[], FeatureIds: string[] }) {
    const rootInvalidatedQuadKeys = invalidated.Tiles;
    const invalidatedFeatureIds = invalidated.FeatureIds;
    const prefixes = invalidated.Prefixes;

    if (Array.isArray(rootInvalidatedQuadKeys)) {
      this.workerService.invalidateAndUpdate(INVALIDCACHETYPE.Tiles, overlay.id, rootInvalidatedQuadKeys)
    }
    if (Array.isArray(invalidatedFeatureIds)) {
      this.workerService.invalidateAndUpdate(INVALIDCACHETYPE.FeatureIds, overlay.id, invalidatedFeatureIds)
    }

    if (Array.isArray(prefixes)) {
      this.workerService.invalidateAndUpdate(INVALIDCACHETYPE.Prefixes, overlay.id, prefixes)
    }
    this.updateOverlay(overlay, true);
  }

  updateOverlay(overlay: TileOverlayAbstract<any>, updateAll = false): void {
    console.log("========================================================================")
    if (!(overlay instanceof TileOverlayAbstract)) {
      return null;
    }
    // this.checkEnableLabelgun(overlay);
    // const zoom = overlay.layer.type === LayerType.POINT && currentZoom > (overlay.layer.minZoom || 999) ?
    //   overlay.layer.minZoom : this.mapService.map.getZoom();
    const zoom = this.mapService.map.getZoom();
    let subscriptionUpdateOverlay: IOverlaySubscription;
    if (this.subscriptionUpdateOverlays.has(overlay.id)) {
      subscriptionUpdateOverlay = this.subscriptionUpdateOverlays.get(overlay.id);
      subscriptionUpdateOverlay.subscription.unsubscribe();
    } else {
      subscriptionUpdateOverlay = {
        id: overlay.id,
        subscription: new Subscription()
      };
    }

    this.ngZone.runOutsideAngular(() => {
      this.totalLoading = this.totalLoading - this.finishedLoading;
      this.finishedLoading = 0;
      let shapeSetTimeOutIndex = this.shapeSettimeout.findIndex(e => e.id === overlay.id);
      if (shapeSetTimeOutIndex == -1) {
        shapeSetTimeOutIndex = this.shapeSettimeout.push({
          id: overlay.id,
          setTimeouts: [],
          setTimeoutsUpdatedShape: []
        }) - 1;
      }
      if (updateAll) {
        overlay.clear();
        if (overlay instanceof HeatmapOverlay) {
          overlay.setMapBack();
        }
      }
      this.workerService.cancelOverlay(overlay.id);
      let selectedIds;
      if (this.showSelectedOnly) {
        const selected = this.selectionService.selectionStore.get(overlay.id);
        if (selected && selected.size > 0) {
          selectedIds = Array.from(selected.values());
        } else {
          selectedIds = [];
        }
      }
      const currentTiles = overlay.getTiles();
      // const tileIds = getTiles(this.mapService.getBounds(), zoom);
      this.resetTimer();
      this._workerLoading.set(overlay.id, 0);
      if (overlay instanceof ClusterOverlay) {
        this.updateOverlayCluster(overlay, zoom, subscriptionUpdateOverlay, selectedIds, currentTiles, shapeSetTimeOutIndex, updateAll);
        return;
      }
      this.calculateLoading();
      console.log("currentTiles", currentTiles);
      console.log(overlay)
      subscriptionUpdateOverlay.subscription = this.workerService.updateOverlay({
        filter: this.filterService.filterActiveStore[overlay.layer.id],
        layerId: overlay.id,
        viewport: getBoundingBox(this.mapService.getBounds()),
        zoomLevel: zoom,
        layer: overlay.layer,
        isClusterOverlay: overlay instanceof ClusterOverlay,
        selectedIds,
        updateAll,
        currentTiles,
        ClippingGeometryNames: overlay.layer.clippingGeometryNames
      }).subscribe(_data => {
        if (!_data) return;
        const { shapesCreated, shapesDeleted, loading, shapesUpdated } = _data;
        this._workerLoading.set(overlay.id, isNaN(loading) ? 1 : loading);

        if (shapesDeleted && shapesDeleted.length) {
          overlay.deleteShapesById_async(shapesDeleted);
        }
        if (shapesCreated && shapesCreated.length) {
          const timeouts = [];
          let totalShapesRender = 0;
          this.addTotalLoading(shapesCreated.length);
          shapesCreated.forEach(element => {
            if (overlay.hasShape(element.id)) {
              overlay.updateShapeTile(element.id, element.tile.id);
            }
            let shapeSettimeout = setTimeout(() => {
              this.createShape(overlay, element.tile, element.data, () => {
                timeouts.push(shapeSettimeout);
                totalShapesRender++;
                if (totalShapesRender == shapesCreated.length) {
                  this.addFinishedLoading(shapesCreated.length);
                  console.log("createShape", this.workerLoading, this.totalLoading, this.finishedLoading)
                  if (shapesCreated[0].tile && shapesCreated[0].tile.id) {
                    overlay.addTile(shapesCreated[0].tile.id, shapesCreated.map(e => e.id))
                  }
                  timeouts.forEach(_e => {
                    let index = this.shapeSettimeout[shapeSetTimeOutIndex].setTimeouts.findIndex(e => e == _e)
                    this.shapeSettimeout[shapeSetTimeOutIndex].setTimeouts.splice(index, 1);
                  })
                }
              })
              if (this.checkShapesSize(overlay)) {
                const style = this.labelService.getActiveStyleByLayerId(overlay.id);
                if (style) {
                  this.labelService.setActiveStyleByLayerId(overlay.id, null);
                  this.actionMessageService.sendInfo('Viewing this many labels at once could cause slow performance. Please zoom in, or setup a scale range in the label style.')
                }
              }
            }, 0);
            this.shapeSettimeout[shapeSetTimeOutIndex].setTimeouts.push(shapeSettimeout);
            // console.log("created", element.tile)
          });

        }
        if (shapesUpdated && shapesUpdated.length) {
          console.log("shapesUpdated", shapesUpdated)
          if (overlay instanceof TileOverlay && overlay.layer.type == LayerType.POINT) {
            let _shapeSettimeout = setTimeout(() => {
              shapesUpdated.forEach(element => {
                if (overlay.hasShape(element.id)) {
                  overlay.updateShapeTile(element.id, element.tile.id);
                } else {
                  let __shapeSettimeout = setTimeout(() => {
                    this.createShape(overlay, element.tile, element.data, () => {
                      overlay.addTile(element.tile.id, [element.id])
                      let index = this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.findIndex(e => e == __shapeSettimeout)
                      this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.splice(index, 1);
                    })
                  }, 0);
                  this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.push(__shapeSettimeout);
                }
              })
              let index = this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.findIndex(e => e == _shapeSettimeout)
              this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.splice(index, 1);
            })
            this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.push(_shapeSettimeout);
          } else {
            shapesUpdated.forEach(element => {
              let _shapeSettimeout = setTimeout(() => {
                overlay.deleteShape(element.id);
                this.createShape(overlay, element.tile, element.data, () => {
                  overlay.addTile(element.tile.id, [element.id])
                  let index = this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.findIndex(e => e == _shapeSettimeout)
                  this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.splice(index, 1);
                })
              }, 0);
              this.shapeSettimeout[shapeSetTimeOutIndex].setTimeoutsUpdatedShape.push(_shapeSettimeout);
            });
          }
        }
        if (loading === 1 || isNaN(loading)) {
          this.calculateLoading();
        }
      }, err => {
        this.actionMessageService.sendError(decorateError(err).error.message)
        this._workerLoading.set(overlay.id, 1);
      })
      subscriptionUpdateOverlay.subscription.add(() => {
        this._workerLoading.delete(overlay.id);
        this.cancelSettimeout.next(overlay.id);
      })
      this.subscriptionUpdateOverlays.set(overlay.id, subscriptionUpdateOverlay);
    });
  }


  updateOverlayCluster(overlay: ClusterOverlay, zoom, subscriptionUpdateOverlay, selectedIds, currentTiles, shapeSetTimeOutIndex, updateAll) {
    overlay.clear();
    this.addTotalLoading(100);
    let currentLoading = 0;
    const { mapType, columnName } = overlay.style.opts
    subscriptionUpdateOverlay.subscription = this.workerService.updateOverlay({
      filter: this.filterService.filterActiveStore[overlay.layer.id],
      layerId: overlay.id,
      viewport: getBoundingBox(this.mapService.getBounds()),
      zoomLevel: zoom,
      layer: overlay.layer,
      isClusterOverlay: true,
      selectedIds,
      updateAll,
      currentTiles,
      isVoronoi: mapType === ClusterType.AREA,
      columnName,
      ClippingGeometryNames: overlay.layer.clippingGeometryNames
    }).subscribe(_data => {
      if (!_data) return;
      const { clusters, loading, tileIds } = _data;
      const workerLoading = isNaN(loading) ? 1 : loading;
      this._workerLoading.set(overlay.id, workerLoading);
      const _loading = Math.ceil(workerLoading * 100);
      const neededLoading = _loading - currentLoading;
      this.addFinishedLoading(neededLoading);
      currentLoading += neededLoading;
      if (clusters && clusters.length) {
        clusters.forEach(element => {
          this.createShape(overlay, null, element)
        });
      }
      if (tileIds) {
        tileIds.forEach(tileId => {
          overlay.addTile(tileId, []);
        });
      }
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message)
      this._workerLoading.set(overlay.id, 1);
    })
    subscriptionUpdateOverlay.subscription.add(() => {
      const neededLoading = 100 - currentLoading;
      this.addFinishedLoading(neededLoading);
      this._workerLoading.delete(overlay.id);
      this.cancelSettimeout.next(overlay.id);
    })
    this.subscriptionUpdateOverlays.set(overlay.id, subscriptionUpdateOverlay);
  }

  deleteShapeByOverlayId(overlayId, shapeId) {
    if (this.overlays.get(overlayId).hasShape(shapeId)) {
      this.overlays.get(overlayId).deleteShape(shapeId);
    }
  }

  private convertFeatureIdToRRKey(id: string): number {
    let num = 0;
    id = id.toLowerCase();

    for (let i = 0; i < id.length; i++) {
      num += id.charCodeAt(i);
    }
    return num;
  }

  private addTotalLoading(num?: number) {
    if (num != undefined) {
      this.totalLoading += num;
    } else {
      this.totalLoading++;
    }
    this.calculateLoading();
  }

  private addFinishedLoading(num?: number) {
    if (num != undefined) {
      this.finishedLoading += num;
    } else {
      this.finishedLoading++;
    }
    this.calculateLoading();
  }

  private createFeatureFilter(predicates: IPredicate[], schema: ISchema): (feature: GeoJsonFeature<IGeometry>) => boolean {
    if (!(predicates) || predicates.length === 0) {
      return (a: any) => true;
    }

    const subFilters = Array<(feature: GeoJsonFeature<IGeometry>) => boolean>();

    for (let i = 0; i < predicates.length; i++) {
      // build up sub filter methods
      const pred = predicates[i];

      if (pred instanceof SpatialBinaryPredicate) {
        const sbpred = <SpatialBinaryPredicate>pred;
        const lhsAccessor = this.getAccessorForExpression(sbpred.Expression);
        const rhsAccessor = this.getAccessorForExpression(sbpred.Other);
        subFilters.push((feature: GeoJsonFeature<IGeometry>) => <boolean>(<(a: any, b: any) =>
          boolean>sbpred.Operator.Filter)(lhsAccessor(feature), rhsAccessor(feature)));
      } else if (pred instanceof BinaryPredicate) {
        const bpred = <BinaryPredicate<Operator>>pred;

        const lhsAccessor = this.getAccessorForExpression(bpred.Expression);
        const rhsAccessor = this.getAccessorForExpression(bpred.Other);

        subFilters.push((feature: GeoJsonFeature<IGeometry>) => <boolean>(<(a: any, b: any) =>
          boolean>bpred.Operator.Filter)(lhsAccessor(feature), rhsAccessor(feature)));
      } else if (pred instanceof NullabilityPredicate) {

        const bpred = <BinaryPredicate<Operator>>pred;
        const lhsAccessor = this.getAccessorForExpression(bpred.Expression);

        subFilters.push((feature: GeoJsonFeature<IGeometry>) => <boolean>(<(a: any) => boolean>bpred
          .Operator.Filter)(lhsAccessor(feature)));
      } else if (pred instanceof Junction) {
        const junc = <Junction>pred;

        const mapped = junc.Predicates.map(x => this.createFeatureFilter([x], schema));

        switch (junc.Operator.Name) {
          case JunctionOperator.Or.Name: {
            subFilters.push((feature: GeoJsonFeature<IGeometry>) => mapped.some(a => a(feature)));
            break;
          }
          default: {
            subFilters.push((feature: GeoJsonFeature<IGeometry>) => mapped.every(a => a(feature)));
            break;
          }
        }
      } else {
        throw createSimpleError(pred.Type + ' not implemented');
      }
    }

    return (a: any) => {
      return subFilters.every((flt, i) => flt(a));
    };
  }

  private getAccessorForExpression(expr: IExpression): (feature: GeoJsonFeature<IGeometry>) => any {

    if (expr instanceof PropertyExpression) {
      const pex = <PropertyExpression>expr;

      let propertyName = pex.PropertyName;

      // jd:hack because the schema will likely list the column as "geom" however the geojson spec requires "geometry"
      propertyName = (propertyName.toLowerCase() === 'geom') ? 'geometry' : propertyName;

      if (propertyName.toLowerCase() === 'geometry') {
        return (feature: GeoJsonFeature<IGeometry>) => feature.geometry;
      }

      return (feature: GeoJsonFeature<IGeometry>) => pex.ReturnType.Converter(
        (feature.properties) ?
          (<{ [key: string]: any }>feature.properties)[propertyName] :
          (<{ [key: string]: any }>feature)[propertyName]);
    }
    if (expr instanceof ConstantCollectionExpression) {
      const ccexpr: ConstantCollectionExpression = <ConstantCollectionExpression>expr;

      const arr = ccexpr.Values.map(a => expr.ReturnType.Converter(a));
      return (feature: GeoJsonFeature<IGeometry>) => arr;

    }
    if (expr instanceof ConstantExpression) {
      const cexpr = <ConstantExpression>expr;
      return (feature: GeoJsonFeature<IGeometry>) => cexpr.ReturnType.Converter(cexpr.Value);
    }

    throw createSimpleError('Not implemented');
  }

  private createShape(overlay: TileOverlayAbstract<any>, tile: IOverlayTile, data: any, callback?) {
    try {
      const zoom = this.mapService.map.getZoom();
      const labelStyle = this.labelService.getActiveStyleByLayerIdForRendering(overlay.id, zoom);
      overlay.addShapeFromData(data, tile, labelStyle, callback);
    } catch (e) {
      console.log(e, data);
    }
  }

  private calculateLoading(isUpdateOverlay = false) {
    const loading = this.finishedLoading == 0 ||
      this.totalLoading == 0 ? 0 : this.finishedLoading / this.totalLoading;
    let process = (loading + this.workerLoading) / 2;
    if (this.workerLoading == 1 && isNaN(this.finishedLoading / this.totalLoading)) {
      process = 1;
    }
    this.loadingSource.next(process);
  }
  private enableLabelgun() {
    this.labelgunService.nextChange();
  }
  checkShapesSize(overlay: OverlayAbstract<OverlayDataItem>) {
    const layer = this.layerService.getLayer(overlay.id);
    if (overlay && overlay.shapes.size > 2000) {
      if (overlay.getShapes()[0]) {
        return true;
      }
    }
    return false;
  }

  stopRenderShapes(deleteOverlay = false) {
    this.overlays.forEach(overlay => {
      if (overlay instanceof TileOverlayAbstract) {
        if (deleteOverlay) this.workerService.deleteOverlay(overlay.id);
        if (this.subscriptionUpdateOverlays.has(overlay.id)) {
          let subscriptionUpdateOverlay: IOverlaySubscription = this.subscriptionUpdateOverlays.get(overlay.id);
          subscriptionUpdateOverlay.subscription.unsubscribe();
        }
      }
    })
  }

  stopRenderOverlayShapes(overlayId: string, deleteOverlay = false) {
    const overlay = this.overlays.get(overlayId);
    if (overlay && overlay instanceof TileOverlayAbstract) {
      if (deleteOverlay) this.workerService.deleteOverlay(overlay.id);
      if (this.subscriptionUpdateOverlays.has(overlay.id)) {
        let subscriptionUpdateOverlay: IOverlaySubscription = this.subscriptionUpdateOverlays.get(overlay.id);
        subscriptionUpdateOverlay.subscription.unsubscribe();
      }
    }
  }

  updateLabelStyle(overlay, labelStyle) {
    if (overlay instanceof TileOverlay) {
      overlay.updateLabelStyle_async(labelStyle, () => {
        if (!IS_MORRISON) {
          this.enableLabelgun();
        }
      });
    }
  }

  checkEnableLabelgun(overlay) {
    if (overlay instanceof TileOverlay) {
      if (!IS_MORRISON) {
        let count = 0;
        overlay.allShapes((shape: OverlayShape) => {
          if ((shape)) //jd test to prevent NRE
            shape.updateLabelStyle(() => {
              count++;
              if (count == overlay.shapes.size) {
                this.enableLabelgun()
              }
            });
        });
      } else {
        overlay.allShapes((shape: OverlayShape) => {
          shape.updateLabelStyle();
        });
      }
    }
  }

  resetTimer() {
    this.nextTimer(0);
    this._timer = new Date().getTime();
  }

  nextTimer(value) {
    this.timerSource.next(value)
  }

  unSubscriptionTimer() {
    const currentTime = new Date().getTime();
    this.nextTimer((currentTime - this._timer) / 1000);
  }

}

