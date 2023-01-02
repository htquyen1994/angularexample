import { Component, HostBinding, Output, EventEmitter, ChangeDetectorRef, Input, ViewEncapsulation } from '@angular/core';
import {
  SelectionService,
  SettingsService,
  AccountService,
  LayerService,
  LayerDataService,
  OverlayShape,
  OverlayService,
  ActionMessageService,
  DrawingOverlay,
  HttpService,
  MapService,
  IsogramService,
  ZINDEX,
  ICONS,
  COLORS,
  UNITS
} from '../../shared';
import { MapToolType, TravelType, OverlayShapeType } from '../../shared/enums';
import { TravelModel, IStartUpSettings, PolygonRequest, ISelection, OverlayShapeOptions } from '../../shared/interfaces';
import { ReportFormat, IReportRequest, IReport, ICoordinate, VALIDATE_UK, VALIDATE_ROI, ISO3166, ReportType } from '../models/report';
import { ReportService } from '../services/report.service';
import { Observable, of, forkJoin, Subscription, Observer, Subject } from 'rxjs';
import { map, debounceTime, takeUntil } from 'rxjs/operators';
import { DrawingService } from '../../map/services/drawing.service';
import { decorateError, createSimpleError } from '../../shared/http.util';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'go-report-panel',
  moduleId: module.id,
  templateUrl: 'report-panel.component.html',
  styleUrls: ['report-panel.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class ReportPanelComponent {

  @Output() close = new EventEmitter<boolean>();
  @Output() change = new EventEmitter<boolean>();
  @Output() modelChanged = new EventEmitter<TravelModel>();
  @Output() load = new EventEmitter<boolean>();
  @HostBinding('attr.tabindex') tabindex = 1;

  model: TravelModel = {
    mode: 'car',
    valueTime: 5,
    valueDistance: 1,
    towardsOrigin: false,
    type: TravelType.DURATION,
    isDetail: true,
    scenario: ''
  };

  travelType = TravelType;
  isMetric = true;
  isDevMode = false;
  ReportType = ReportType;
  reportSelected: IReport;

  mapToolType = MapToolType;
  activeMapTool = MapToolType.CIRCLE;
  drawActiveMapTool = MapToolType.CIRCLE;
  isCatchment: boolean = false;

  reportFormat = ReportFormat;
  reportParams: IReportRequest = {
    reportId: '',
    reportFormat: ReportFormat.EXCEL,
    shapes: '',
    zoomLevel: null,
    center: null,
    encodePaths: [],
    userName: null,
    shapeCodes: [],
  }

  _isLoading: boolean = false;
  reports: IReport[];
  reportOptions: PsSelectOption[];
  private overlay: DrawingOverlay;
  // private dirtyShapes: OverlayShape[] = [];
  loading: boolean = false;
  @Input()
  set isLoading(value: boolean) {
    this._isLoading = value;
    this.changeRef.markForCheck();
    this.changeRef.detectChanges();
  }
  shapeChangeSubcriptions: Subscription[] = [];
  reportSelection: ISelection;
  private shape: OverlayShape;
  private unsubscribe$: Subject<void> = new Subject<void>();
  private _drawingManagerListener: google.maps.MapsEventListener;
  isoGramDrawingManager: google.maps.drawing.DrawingManager;
  constructor(
    private selectionService: SelectionService,
    private settingsService: SettingsService,
    private accountService: AccountService,
    private changeRef: ChangeDetectorRef,
    private reportService: ReportService,
    private layerService: LayerService,
    private layerDataService: LayerDataService,
    private overlayService: OverlayService,
    private actionMessageService: ActionMessageService,
    private httpService: HttpService,
    private mapService: MapService,
    private isogramService: IsogramService
  ) {

    this.accountService.account.subscribe(account => {
      this.isDevMode = account.isDevMode;
      this.isMetric = account.isMetric;
      this.reportParams.userName = account.username;
    });

    this.reportService.getReportName().subscribe(res => {
      this.reports = res;
      this.reportParams.reportId = res[0].id;
      this.reportOptions = this.reports.map(e => ({ label: e.name, value: e.id }))
      this.onReportSelect();
      changeRef.detectChanges();
    })

    this.selectionService.active.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((selection) => {
      if (!selection.isAdd) {
        return;
      }
      this.reportService.setShapeReport(selection);
    })

    this.reportService.reportShape.pipe(debounceTime(500)).subscribe(selection => {
      this.reportSelection = selection;
    });
  }

  ngOnInit() {
    this.overlay = <DrawingOverlay>this.overlayService.overlays.get('__REPORT');
    // this.initReport();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.mapService.map.setOptions({
      draggableCursor: null
    });
    // if (this._drawingManagerListener) {
    //   this._drawingManagerListener.remove();
    //   this._drawingManagerListener = null;
    // }
    // if (this.isoGramDrawingManager) {
    //   this.drawingService.removeCustomDrawingManager(this.isoGramDrawingManager);
    //   this.isoGramDrawingManager = null;
    // }
  }

  // initReport() {
  //   this.drawingService.overlay = <DrawingOverlay>this.overlayService.overlays.get('__DRAW');
  //   this.isogramService.travel.pipe(
  //     takeUntil(this.unsubscribe$)
  //   ).subscribe((polygon: any) => {
  //     if (polygon.error) {
  //       this.emitLoading(false)
  //       return;
  //     }
  //     if (!this.shape) {
  //       const opts: OverlayShapeOptions = {
  //         zIndex: ZINDEX.INFOWINDOW,
  //         isSelectable: true
  //       };
  //       this.shape = this.drawingService.overlay.addShapeByCoordinates(null, polygon.type, polygon.coordinates, opts);
  //       this.selectionService.changeSelection({
  //         isAdd: true,
  //         overlayId: this.drawingService.overlay.id,
  //         shapeId: this.shape.id
  //       });
  //     }
  //     this.emitLoading(false)
  //   });
  //   this._drawingManagerListener = this.drawingService.drawingManager.addListener('overlaycomplete', () => {
  //     this.setTool(null);
  //   });
  // }

  // onTool(tool: MapToolType) {
  //   this.activeMapTool = tool;
  //   if (tool !== null) {
  //     this.drawActiveMapTool = tool;
  //   }
  //   this.isCatchment = tool === MapToolType.REPORTS;
  //   if(this.isCatchment){
  //     if (this.isoGramDrawingManager) {
  //       this.drawingService.removeCustomDrawingManager(this.isoGramDrawingManager);
  //       this.isoGramDrawingManager = null;
  //     }
  //     const opts = {
  //       isEditable: false,
  //       isSelectable: false,
  //       icon: ICONS.LOCATION,
  //       fillColor: COLORS.LOCATION,
  //     }
  //     this.isoGramDrawingManager = this.drawingService.customDrawingManager(OverlayShapeType.Point, opts)
  //     this.isoGramDrawingManager.addListener('markercomplete', (shapeRef: google.maps.Marker) => {
  //       this.isLoading = true;

  //       const location = shapeRef.getPosition();
  //       shapeRef.setMap(null);
  //       this.mapService.addMarker(location, ICONS.LOCATION, opts);
  //       if (this.shape) {
  //         this.shape = null;
  //       }
  //       const model = Object.assign({}, this.model, {
  //         value: this.isMetric || this.model.type === TravelType.DURATION ?
  //           this.model.valueTime : this.model.valueDistance * UNITS.MILE.constant / 1000
  //       });

  //       //this.fireOnce = true
  //       this.isogramService.init(location, model);
  //     });
  //     this.isoGramDrawingManager.setDrawingMode(<any>(
  //       MapToolType[MapToolType.MARKER].toLowerCase()
  //     ))
  //   }
  //   this.change.emit(null);
  // }

  // setTravelType(type: TravelType) {
  //   this.model.type = type;
  //   this.modelChanged.emit(this.model);
  // }

  setReportFormat(format: ReportFormat) {
    this.reportParams.reportFormat = format;
  }

  // setMode(mode: string) {
  //   this.model.mode = mode;
  //   if (this.model.mode === 'foot' && Number(this.model.valueDistance) > 5) {
  //     this.model.valueDistance = 5;
  //   }
  //   this.modelChanged.emit(this.model);
  // }

  // localModelChanged(blah: any) {
  //   this.modelChanged.emit(this.model);
  // }

  // // is always minutes now.
  // format(value: number): string {
  //   return `${Number(value).toFixed(1)}`;
  // }

  onDownload() {
    if (this.reportSelected.reportType == ReportType.SELECTCLUB) {
      this.onDownloadSelectPointReport();
    } else {
      this.onDownloadDrawingReport();
    }
  }

  onDownloadDrawingReport() {
    this.emitLoading(true);
    this.loadShapes((polygons: any[]) => {
      if (!polygons || polygons.length == 0) {
        this.actionMessageService.sendWarning(
          "Please select shapes for report."
        );
        return;
      }
      try {
        let data = this.onLocateShapes(polygons);
        this.validateShapes(this.reportParams.reportId, data.center).pipe(
          takeUntil(this.unsubscribe$)
        ).subscribe(res => {
          this.emitLoading(true);
          this.reportParams.shapeCodes = polygons.map(e => e.id); //use for cache in BE // get from gCode
          this.reportParams.encodePaths = data.paths;
          this.reportParams.center = data.center;
          this.reportParams.zoomLevel = this.mapService.map.getZoom();
          this.reportParams.shapes = JSON.stringify(polygons);
          this.reportParams.shapeId = undefined;
          this.reportService.getReport(this.reportParams).pipe(
            takeUntil(this.unsubscribe$)
          ).subscribe(data => {
            this.httpService.downloadFile(data.file);
            this.emitLoading(false);
          }, err => {
            this.reportErrorHandle(err);
            this.emitLoading(false);
          })
        }, err => {
            this.reportErrorHandle(err);
            this.emitLoading(false);
        })
      } catch (error) {
        this.reportErrorHandle(error);
        this.emitLoading(false);
      }
    }, err => {
        this.reportErrorHandle(err);
        this.emitLoading(false);
    })
  }

  onDownloadSelectPointReport() {
    let selectedIds = []
    this.selectionService.selectionStore.forEach((shapes, layerId) => {
      if (shapes.size > 0) {
        const layer = this.layerService.layerStore.get(layerId);
        if (layer) {
          const selected = this.selectionService.selectionStore.get(layer.id);
          if (selected && selected.size > 0) {
            selectedIds = [...selectedIds, ...Array.from(selected.values())]
          }
        }
      }
    })
    if (!selectedIds || selectedIds.length == 0) {
      this.actionMessageService.sendError(
        "Please select CLUB for report."
      );
      return;
    }
    if (selectedIds && selectedIds.length > 1) {
      this.actionMessageService.sendError(
        "Please just select 1 CLUB for report."
      );
      return;
    }
    this.emitLoading(true);
    this.reportParams.shapeCodes = undefined;
    this.reportParams.encodePaths = undefined;
    this.reportParams.center = undefined;
    this.reportParams.zoomLevel = this.mapService.map.getZoom();
    this.reportParams.shapes = undefined;
    this.reportParams.shapeId = selectedIds[0];
    this.reportService.getReport(this.reportParams).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(data => {
      this.httpService.downloadFile(data.file);
      this.emitLoading(false);
    }, err => {
      this.reportErrorHandle(err);
      this.emitLoading(false);
    })
  }

  loadShapes(callback?: Function, error?: Function) {
    this.clearResults(null, () => {
      let shapesObservables: Observable<any>[] = [];
      this.createShapes(shapesObservables);
      this.reportService.collectShape(shapesObservables, this.overlay, this.reportSelected.reportType).pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((shapeObservables: PolygonRequest[]) => {
        this.getPolygon(shapeObservables, callback, error);
      }, err => {
        if (error) {
          error(err);
        }
      })
    });
  }

  createShapes(shapesObservables) {
    this.selectionService.selectionStore.forEach((shapes, layerId) => {
      if (shapes.size > 0) {
        const layer = this.layerService.layerStore.get(layerId);
        if (layer) {
          const col = layer.columns.find(column => column.isIdentifier);
          const identifierColumn = col ? col.id : '';
          shapesObservables.push(
            this.layerDataService.getLayerDataGeomsForSelectedRecords(layer).pipe(
              map((x: any) => {
                return x.results.map(data => {
                  const geometry = data.geom || data.Geom;
                  const shape = OverlayShape.factory(
                    null,
                    <any>OverlayShapeType[<any>geometry.type],
                    { geometry: geometry.coordinates },
                    {
                      layerId: layer.id,
                      shapeId: data[identifierColumn]
                    },
                    null
                  );
                  shape.clean();
                  return shape;
                });
              })
            )
          );
        } else {
          const overlay = this.overlayService.overlays.get(layerId);
          const collectedShapes = Array.from(shapes)
            .map(shapeId => overlay.shapes.get(shapeId))
            .filter(shape => shape && shape.type !== OverlayShapeType.LineString);
          shapesObservables.push(of(collectedShapes));
        }
      }
    });
  }

  getPolygon(shapeObservables: PolygonRequest[], callback: Function, err?: Function) {
    if (shapeObservables.length === 0) {
      this.actionMessageService.sendWarning('Please select shape');
    } else {
      this.reportService.decoratePolygons(shapeObservables).pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(({ polygons, shapes }) => {
        // this.dirtyShapes = shapes;
        if (callback) {
          callback(polygons);
        }
      }, error => {
        if (err) {
          err(error);
        }
      });
    }
  }


  clearResults(selection: ISelection = null, callback?) {
    if (this.shapeChangeSubcriptions.length > 0) {
      this.shapeChangeSubcriptions.forEach(e => {
        e.unsubscribe();
      })
      this.shapeChangeSubcriptions = [];
    }
    this.selectionService.clearLayerSelections(this.overlay.id);

    const excludeShapes = selection ? [selection.shapeId] : [];
    this.overlay.deleteShapes(excludeShapes);
    if (callback)
      callback();
  }

  onLocateShapes(shapes: any[]) {
    let coordinates = [];
    let paths: string[] = [];
    shapes.forEach(element => {
      if (element.type == OverlayShapeType[OverlayShapeType.MultiPolygon]) {
        element.coordinates.forEach(e => {
          coordinates = coordinates.concat(e[0]);
          let _coordinates = e[0].map(_e => {
            return new google.maps.LatLng(_e[1], _e[0]);
          });
          paths.push(google.maps.geometry.encoding.encodePath(_coordinates))
        });
      } else if (element.type == OverlayShapeType[OverlayShapeType.Polygon]) {
        coordinates = coordinates.concat(element.coordinates[0]);
        let _coordinates = element.coordinates[0].map(e => {
          return new google.maps.LatLng(e[1], e[0]);
        });
        paths.push(google.maps.geometry.encoding.encodePath(_coordinates))
      } else if (element.type == OverlayShapeType[OverlayShapeType.Point]) {
        coordinates = coordinates.concat([element.coordinates]);
        paths.push(google.maps.geometry.encoding.encodePath([new google.maps.LatLng(element.coordinates[1], element.coordinates[0])]))
      }
      else {
        throw createSimpleError('Not implement');
      }
    });

    return {
      paths: paths,
      center: this.getCenter(coordinates)
    }
  }

  getCenter(coordinates: any[]) {
    var bounds = new google.maps.LatLngBounds();
    coordinates.forEach((point: any) => {
      bounds = bounds.extend(new google.maps.LatLng(point[1], point[0]));
    });
    const center = bounds.getCenter();
    return {
      lat: center.lat(),
      lng: center.lng()
    }
  }
  emitLoading(value: boolean) {
    this.load.emit(value)
    this.loading = value
    this.changeRef.detectChanges();
  }

  // setTool(mapToolType: MapToolType) {
  //   this.activeMapTool = mapToolType;
  //   if (!this.activeMapTool) {
  //     this.drawingService.drawingManager.setDrawingMode(null);
  //     this.mapService.map.setOptions({
  //       draggableCursor: null
  //     });
  //   }
  //   this.changeRef.detectChanges();
  // }

  validateShapes(reportId: string, center: ICoordinate): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      let report = this.reports.find(e => e.id == reportId);
      if (!report) {
        throw createSimpleError(`Can't detect report`);
      }
      if (!report.coverageRegions) {
        observer.next(true);
        observer.complete();
        return;
      }
      let geocoder = new google.maps.Geocoder;
      geocoder.geocode({ 'location': center }, (res, status) => {
        try {
          if (status === google.maps.GeocoderStatus.OK) {
            if (!res[0]) {
              throw createSimpleError(`Can't detect Location.`);
            }
            let country = res[0].address_components.find(e => e.types.includes('country'));
            if (!country) {
              throw createSimpleError(`Can't detect Country.`);
            }
            let countryCode = country.short_name;
            if (report.coverageRegions.includes(countryCode)) {
              observer.next(true);
              observer.complete();
              return;
            } else {
              let countriesName = ISO3166.filter(e => report.coverageRegions.includes(e["alpha-2"])).map(e => e.name).join(', ');
              throw createSimpleError(`The data for this report is limited to ${countriesName}. Please draw another shape within ${countriesName}.`);
            }
          } else {
            if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
              throw createSimpleError('Can not detect location.');
            }
            else {
              throw createSimpleError('Geocoder failed due to: ' + status);
            }
          }
        } catch (error) {
          observer.error({ msg: decorateError(error).error.message });
        }
        observer.error({ msg: 'Not Implement' });
      })
    })
  }

  reportErrorHandle(err) {
    if (err) {
      if (err.msg) {
        this.actionMessageService.sendError(
          err.msg
        );
      } else {
        const error:any = err && err.error && err.error.data && !err.error.data.error ? createSimpleError("No road network available at this location."): decorateError(err) ;
        this.actionMessageService.sendError(error.error.message);
      }
    }
  }

  onReportSelect() {
    this.reportSelected = this.reports.find(e => e.id == this.reportParams.reportId);
    if (this.reportSelected) {
      // if (this.reportSelected.reportType == ReportType.SELECTCLUB) {
      //   this.onTool(null);
      // } else if (this.reportSelected.reportType == ReportType.SELECTPOINT) {
      //   this.onTool(MapToolType.MARKER);
      // } else if (this.reportSelected.reportType == ReportType.SELECTPOLYGONUNION || this.reportSelected.reportType == ReportType.SELECTPOLYGON) {
      //   this.onTool(MapToolType.CIRCLE);
      // } else {
      //   this.onTool(this.drawActiveMapTool);
      // }
    }
  }
}
