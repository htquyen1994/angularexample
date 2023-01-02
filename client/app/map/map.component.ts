import { first, map } from 'rxjs/operators';
import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild, ChangeDetectionStrategy, TemplateRef, Renderer2 } from '@angular/core';

import {
  AccountService,
  ActionMessageService,
  AppInsightsService,
  DrawingOverlay,
  InsightService,
  LayerDataService,
  LocationService,
  MapService,
  OverlayService,
  PanelService,
  SelectionService,
  SettingsService,

  IsogramService,
  OverlayShape,
  //LayerService,
  //IStartUpSettings,
  UNITS,
  ZINDEX,
  LayerService,
  MAXINTERSECTED,
  MAXUNIONED,
  MAXQUICKEDIT,
  calculateVH,
  geoCoderResultToString,
  IS_POSTOFFICE,
  ICONS,
  COLORS
} from '../shared';

import {
  DropdownComponent,
  ButtonComponent
} from '../shared/components'
import { DrawingService } from './services/drawing.service';
import { ROADMAP_BW_STYLE, ROADMAP_POI_STYLE, SIMPLE_MAP_STYLE } from './map.styles';
import { InsightToolComponent } from './insight-tool/insight-tool.component';
import { OrdnanceSurveyMapType } from './ordnanceSurveyMapType';
import { MapToolType, OverlayShapeType, TravelType, CursorType, LayerType, NOT_DRAWING_OVERLAYS, OVERLAY_TYPE } from '../shared/enums';
import { IAccount, OverlayShapeOptions, TravelModel, IStartUpSettings, OverlayShapeGeometry } from '../shared/interfaces';
import { ReportPanelComponent } from '../reports/report-panel/report-panel.component';
import { ReportService } from '../reports/services/report.service';
import { Subscription, Observable, of, forkJoin, combineLatest, zip } from 'rxjs';
import { decorateError } from '../shared/http.util';
import { JstsOperatorService } from '../shared/services/jsts-operator.service';
import { QuickEditShape, QuickEdit } from './models/map.model';
import { QuickEditComponent } from './quick-edit/quick-edit.component';
import { ModalService } from '../shared/services/modal.service';
import { MatDialogRef } from '@angular/material/dialog';
import { QuickEditService } from './services/quick-edit.service';
import { RouteToolComponent } from './route-tool/route-tool.component';
import { CrimeStatisticComponent } from './crime-statistic/crime-statistic.component';
import { IsogramComponent } from './isogram/isogram.component';
import { DynamicDialogComponent } from '../shared/containers';
import {
  IDynamicDialogData,
  ILocation
} from '../shared/interfaces'
import {
  LocationFormContainerComponent
} from './containers';
import { MeasurementComponent } from './measurement/measurement.component';
import { MapToolService } from '../shared/services';
import { MapToolHelper, InfoTemplatesHelper } from '../shared/helper';
import { uniq } from 'lodash';
import { environment } from '../../environments/environment';
import { ViewManagementStoreService, ILayerInsightView } from '../core/modules/view-management';
import { ButtonGroupColumnItem } from '../shared/components/button-group-column/button-group-column';
import { NearestMapToolComponent } from '../nearest/containers';
import { NotificationService } from '../notification/services/notification.service';
import { INotification } from '../notification/interfaces';
import { NotificationPopupComponent } from '../notification/containers';
import { MapToolsStoreService } from '../core/services';
import { CommonDialogIds } from '../core/enums';
@Component({
  selector: 'go-map',
  moduleId: module.id,
  templateUrl: 'map.component.html',
  styleUrls: ['map.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit {
  @ViewChild('map', { static: true })
  mapRef: ElementRef;
  @ViewChild('isogram')
  isogramRef: DropdownComponent;
  @ViewChild('insightsTool')
  insightsToolRef: InsightToolComponent;
  @ViewChild('reportsPanel')
  reportsRef: ReportPanelComponent;

  isLoading = false;
  isSidepanelOpen: boolean;
  isResultpanelOpen = 0;


  model: TravelModel = {
    mode: 'car',
    valueTime: 5,
    valueDistance: 1,
    towardsOrigin: false,
    type: TravelType.DURATION,
    isDetail: true,
    scenario:''
  };
  isMetric = true;
  //travelType = TravelType;
  private shape: OverlayShape;
  //



  mapToolType = MapToolType;
  activeMapTool: MapToolType = MapToolType.MEASUREMENT;
  activeDialogTools: MapToolType[] = [];
  mapType: string = 'roadmap';
  timer = false;
  showInfo = true;
  hasGeoLocation = navigator.geolocation !== undefined;
  hasFollowLocation = false;
  hasOSMap = false;
  saveLocation: ILocation = null;
  location: ILocation;
  trafficLayer = new google.maps.TrafficLayer();
  defaultMapTool: string;
  isDevMode = false;
  showZoomLevelIndicator = false;
  createMatch = false;
  canPrint = false;
  viewQuickInsight = false;
  canSplit = false;
  canIntersect = false;
  isPoi = false;
  selectedShapes = 0;
  progress$: Observable<number>;
  isInsightsToolOpen = false;
  isReportsToolOpen = false;
  zoomLevel = 0;
  isogramQISubscription = null;
  canQuickEdit = false;
  account: IAccount = null;
  hasAdvancedReporting = false;
  viewNearest = false;
  watchPositionId: number = -1;

  loadingIcon: any = {};

  _drawingManagerListener: google.maps.MapsEventListener;
  travelSubcription: Subscription;
  timerValue: number = 0;
  quickEditModalRef: MatDialogRef<any>;
  quickEditSubscription: Subscription;
  selectedPointShapes = 0;
  MAXQUICKEDIT = MAXQUICKEDIT;

  expandMapStyle = false;
  expandDrawingTool = false;
  drawingToolDefault: MapToolType = MapToolType.MARKER;
  showRefreshBtn = false;
  mapToolModalRef: {[key: string]: MatDialogRef<any>} = {};
  defaultMapType: any;
  crimeStatisticModalRef: MatDialogRef<CrimeStatisticComponent>;
  isoGramDrawingManager: google.maps.drawing.DrawingManager;
  insightLayers$: Observable<ILayerInsightView[]>;
  private _mapToolHelper: MapToolHelper;
  private _hasAdvancedCatchments = false;
  drawingToolColumnButtons: ButtonGroupColumnItem[] = [
    { id: MapToolType.MARKER, title: "Draw point", icon: "geo-point" },
    { id: MapToolType.POLYLINE, title: "Draw line", icon: "geo-polyline" },
    { id: MapToolType.CIRCLE, title: "Draw circle", icon: "geo-circle" },
    { id: MapToolType.RECTANGLE, title: "Draw rectangle", icon: "geo-rectangle" },
    { id: MapToolType.POLYGON, title: "Draw polygon", icon: "geo-polygon" }
  ]
  mapTypeColumnButtons: ButtonGroupColumnItem[] = [
    { id: 'roadmap', title: "Road", icon: "geo-road" },
    { id: 'roadmap_bw', title: "Road greyscale", icon: "geo-road-bw" },
    { id: 'terrain', title: "Terrain", icon: "geo-terrain" },
    { id: 'hybrid', title: "Aerial", icon: "geo-aerial" },
    { id: 'simple_map', title: "Simple", icon: "geo-terrain-bw" }
  ]
  selectingToolColumnButtons: ButtonGroupColumnItem[] = [
    { id: null, title: "Select shape", icon: "pointer" },
    { id: MapToolType.SELECTION_MAP, title: "Map selection tool: add shapes", icon: "selection-map" },
    { id: MapToolType.SELECTION_POLYGON, title: "Polygon selection tool: add shapes", icon: "selection-polygon" },
    { id: MapToolType.SELECTION_ADD, title: "Selection tool: add shapes", icon: "selection-add" },
    { id: MapToolType.SELECTION_REMOVE, title: "Selection tool: deselect shapes", icon: "selection-remove" },
  ]
  intersectionToolColumnButtons: ButtonGroupColumnItem[] = [
    { id: MapToolType.UNION, title: "Union", icon: "union" },
    { id: MapToolType.INTERSECTION, title: "Intersection", icon: "intersection" },
  ]
  infoTemplatesHelper = new InfoTemplatesHelper(this._renderer);
  public notReadCounting$: Observable<number>
  public selectionMapToolLoading$: Observable<boolean>;
  constructor(
    private mapService: MapService,
    private locationService: LocationService,
    private panelService: PanelService,
    private selectionService: SelectionService,
    private drawingService: DrawingService,
    private applicationInsightsService: AppInsightsService,
    private overlayService: OverlayService,
    private layerDataService: LayerDataService,
    private changeRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private insightService: InsightService,
    private actionMessageService: ActionMessageService,
    private accountService: AccountService,
    private settingsService: SettingsService,
    private isogramService: IsogramService,
    private layerService: LayerService,
    private reportService: ReportService,
    private jstsOperatorService: JstsOperatorService,
    private modalService: ModalService,
    private quickEditService: QuickEditService,
    private _mapToolService: MapToolService,
    private _viewManagementStoreService: ViewManagementStoreService,
    private _renderer: Renderer2,
    private _notificationService: NotificationService,
    private _mapToolsStoreService: MapToolsStoreService
  ) {
    this.selectionMapToolLoading$ = this._mapToolsStoreService.selectionMapLoading$;
    this._mapToolHelper = new MapToolHelper();
    locationService.location.subscribe(
      (item: any) => (this.location = item.find((location: any) => location.isDefault))
    );
    panelService.sidePanel.subscribe((item: any) => {
      this.isSidepanelOpen = item;
    });
    this.progress$ = this.overlayService.loading;

    this.overlayService.timer.subscribe(value => {
      this.timerValue = value;
      this.changeRef.detectChanges();
    });

    const selection$ = this.selectionService.selection;
    const activeLayer$ = this.layerService.layerActive;

    selection$.subscribe(() => {
      let count = 0;
      this.selectionService.selectionStore.forEach((shapes, layerId) => {
        count += shapes.size;
      });
      this.selectedShapes = count;
      this.changeRef.detectChanges();
    });

    combineLatest(
      selection$,
      activeLayer$
    ).subscribe(([selection, activeLayer]) => {
      let shapesPoint = 0;
      if (activeLayer) {
        this.selectionService.selectionStore.forEach((shapes, layerId) => {
          if (activeLayer.id == layerId) {
            if (activeLayer.type === LayerType.POINT && activeLayer.isEditable) {
              shapesPoint += shapes.size;
            }
          }
        });
      }
      this.selectedPointShapes = shapesPoint;
      this.changeRef.detectChanges();
    })

    this.selectionService.split.subscribe(polylineRef => {
      const active = this.selectionService.activeStore;
      if (!active) {
        this.actionMessageService.sendWarning('Please select a shape');
        return null;
      }
      const overlay = this.overlayService.overlays.get(active.overlayId);

      if (overlay.id === '__DRAW') {
        this.actionMessageService.sendWarning(
          'Target shape is not in a layer. Please save the shape into a layer to use the split tool.'
        );
        return null;
      }
      if (!overlay) {
        this.actionMessageService.sendWarning(
          'Target shape is not in a layer. Please save the shape into a layer to use the split tool.'
        );
        return null;
      }

      const shape = overlay.shapes.get(active.shapeId);
      if (!shape) {
        this.actionMessageService.sendWarning('Shape is not on the map');
        return null;
      }

      this.layerDataService.splitRecord(shape, polylineRef).subscribe(
        (data: any) => {
          if (data.error) {
            this.actionMessageService.sendError(data.error);
          } else if (data.id === null) {
            this.actionMessageService.sendInfo('Split polygon successful.');
          }
        },
        error => {
          this.actionMessageService.sendError(
            `Split error: ${decorateError(error).error.message}`
          );
        }
      );
    });

    this.selectionService.shape.subscribe((overlayShape: OverlayShape) =>{
      const activeTool = this.selectionService.activeToolStore;
      switch (activeTool) {
        case MapToolType.SELECTION_MAP:
          const { id, overlayId } = overlayShape;

          this._mapToolsStoreService.getShapesByShape(id, overlayId)
          break;

        default:
          break;
      }
    })
  }

  ngOnInit() {
    this.insightLayers$ = this._viewManagementStoreService.insightLayers$
    this.notReadCounting$ = this._notificationService.notification$.pipe(map((noti: INotification) => noti.list.filter(item => !item.markAsRead).length));
    this.accountService.account.subscribe((item: IAccount) => {
      this.account = item;
      this.isDevMode = item.isDevMode;
      this._hasAdvancedCatchments = item.hasAdvancedCatchments
      this.hasOSMap = item.hasOSMap;
      this.showZoomLevelIndicator = item.showZoomLevelIndicator;
      this.createMatch = item.createMatch;
      this.canSplit = item.canSplit;
      this.canIntersect = item.canIntersect;
      this.viewQuickInsight = item.viewInsight;
      this.canPrint = item.canPrint;
      this.canQuickEdit = item.canQuickEdit;
      this.isMetric = item.isMetric;
      this.hasFollowLocation = (this.hasGeoLocation) ? item.hasFollowLocation : false;
      this.hasAdvancedReporting = item.advancedReporting;
      this.viewNearest = item.viewNearest;
      this.changeRef.detectChanges();
    });

    this.settingsService.startupSettings.subscribe((item: IStartUpSettings) => {
      this.defaultMapTool = item.mapTool;
      this.changeRef.detectChanges();
    });
    this.mapService.mapRx.subscribe(map => {
      this.mapService.map.mapTypes.set('roadmap_bw', ROADMAP_BW_STYLE);
      this.mapService.map.mapTypes.set('roadmap_poi', ROADMAP_POI_STYLE);
      this.mapService.map.mapTypes.set('simple_map', SIMPLE_MAP_STYLE);
      this.mapService.map.mapTypes.set("OS", new OrdnanceSurveyMapType());
      if (this.account && this.account.isDevMode) {
        this.mapService.addCoordMapType();
      }
      this.onMapType(this.mapType);
      this.onTool(
        this.defaultMapTool === undefined || this.defaultMapTool === 'select'
          ? MapToolType.SELECTION
          : MapToolType.MEASUREMENT
      );
      this.zoomLevel = map.getZoom();
      this.changeRef.detectChanges();
    });
    zip(
      this.accountService.account.pipe(first()),
      this.locationService.location.pipe(first())
    ).subscribe(([account, locations])=>{
      this.defaultMapType = account.mapType;
      if (this.mapService.map)
        this.onMapType(this.defaultMapType ? this.defaultMapType : 'roadmap');
      if (account.hasOSMap) {
        this.mapTypeColumnButtons.push({
          id: "OS",
          title: "OS",
          icon: "geo-terrain-os"
        })
      }
      this.location = locations.find(location => location.isDefault);
      if (!this.location) {

        if (locations.length > 0) {
          this.location = locations[0];
        }
        else {

          this.location = {
            coordinates: { lat: 51.5257270458621, lng: -0.3060722351074219 },
            id: '1',
            isDefault: false,
            locationType: 'Point',
            name: 'Home',
            zoom: 13
          };
        }
      }
      this.ngZone.runOutsideAngular(() => {
        this.mapService.setMap(this.mapRef.nativeElement, {
          zoom: this.location.zoom,
          center: this.location.coordinates,
          clickableIcons: IS_POSTOFFICE ?? false,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapId: account.vectorMode ? environment.mapId: undefined,
          isFractionalZoomEnabled: false,
          streetViewControl: true,
          scaleControl: true,
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
          },
          rotateControl: true,
          rotateControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_LEFT
          },
          fullscreenControl: false,
          zoomControl: false,
          mapTypeControl: false,
          maxZoom: 19,
          minZoom: 5,
          //restriction: null,
          tilt: 45,
          styles: !account.vectorMode ? this.getPoiSettings(): undefined
        } as google.maps.MapOptions
        );
      });
    })
    this.selectionService.activeTool.subscribe((mode: MapToolType) => {
      this.setTool(mode);
    });

    this.mapService.zoom.subscribe((zoom: number) => {
      this.zoomLevel = zoom;
      this.changeRef.detectChanges();
    });
  }

  ngAfterViewInit() {
    forkJoin([
      this.accountService.account.pipe(first()),
      this.mapService.mapRx.pipe(first())
    ]).subscribe(([item, map])=>{
      this.defaultMapType = item.mapType;
      if (this.mapService.map) {
        this.onMapType(this.defaultMapType ? this.defaultMapType : 'roadmap');
        item.isDevMode ? this.mapService.addCoordMapType() : null;
      }
    })
  }

  checkSelectedDialogTools([activeDialogTools, tool]){
    return activeDialogTools.includes(tool)
  }

  onHomeLocation() {
    if (this.location) {
      this.mapService.showLocation(this.location.coordinates, this.location.zoom, false);
    }
    this.applicationInsightsService.logEvent('Map Tools', 'Home', '');
  }

  onZoom(change: number) {
    this.isLoading = true;
    this.ngZone.runOutsideAngular(() => {
      const center = this.mapService.getVisibleViewportCenter();
      const level = this.mapService.map.getZoom() + change;
      this.mapService.centreInViewportAtZoomLevel(level, center);

      // this.mapService.map.setZoom(level);
      //  this.mapService.setCenter({lat: center.lat(), lng: center.lng()});
    });
    this.applicationInsightsService.logEvent('Map Tools', 'Zoom', '');
  }


  onMapType(type: string) {
    if (type === 'roadmap_bw' && this.isPoi) {
      type = 'roadmap_poi';
    }
    else if (type === 'roadmap_poi' && !this.isPoi) {
      type = 'roadmap_bw';
    }
    this.mapService.setMapType(type);
    if (type == 'OS') {
      this.initMapOsBranding({ statement: 'Contains OS data &copy; Crown copyright and database rights YYYY' })
    } else if (this.mapType == 'OS') {
      this.removeOSBranding();
    }
    this.mapType = type;
    this.applicationInsightsService.logEvent('Map Tools', 'Map Type', this.mapType);
    this.changeRef.detectChanges();
  }

  onTraffic(button: ButtonComponent) {
    button.setSelected(!button.buttonSelected);
    this.trafficLayer.setMap(this.trafficLayer.getMap() ? null : this.mapService.map);
    this.applicationInsightsService.logEvent('Map Tools', 'Traffic', button.buttonSelected);
  }

  onPoi(button: ButtonComponent = null) {
    this.isPoi = !this.isPoi;
    button.setSelected(this.isPoi);
    this.onMapType(this.mapType);

    this.mapService.map.setOptions({
      styles: this.getPoiSettings()
    });
    this.applicationInsightsService.logEvent('Map Tools', 'Points of Interest', this.isPoi);
  }

  getPoiSettings(): any[] {
    return [
      {
        featureType: 'poi',
        stylers: [{ visibility: this.isPoi ? 'on' : 'off' }]
      },
      {
        featureType: 'poi.park',
        stylers: [{ visibility: 'on' }]
      }
    ];
  }

  onAddLocation(): void {
    if (this.saveLocation) {
      this.saveLocation = null;
      return null;
    }

    const zoom = this.mapService.map.getZoom();
    let point = this.mapService.getVisibleViewportCenter();

    if (
      this.selectionService.activeStore &&
      this.selectionService.activeStore.overlayId === '__DRAW'
    ) {
      const shape = this.overlayService.overlays
        .get('__DRAW')
        .getShape(this.selectionService.activeStore.shapeId);
      if (shape && shape.type === OverlayShapeType.Point) {
        var pt = shape.getCenter();
        point = { lat: pt.lat(), lng: pt.lng() };
      }
    }

    this.saveLocation = {
      coordinates: { lat: point.lat, lng: point.lng },
      isDefault: false,
      locationType: 'Point',
      name: '',
      zoom: zoom
    };

    const geoCoder = new google.maps.Geocoder();

    geoCoder.geocode({ location: this.saveLocation.coordinates }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK) {
        this.saveLocation.name = geoCoderResultToString(results[0]);
      }
    });
  }

  addLocation(location: ILocation) {
    this.locationService.addLocation(location, location.zoom);
    this.saveLocation = null;
  }

  onPrint() {
    this.selectionService.setTool(MapToolType.PRINT);
    const title = document.title;
    document.title = 'Periscope';
    //window.print();
    print();
    document.title = title;
    setTimeout(() => this.selectionService.setTool(MapToolType.SELECTION));
    this.applicationInsightsService.logEvent('Map Tools', 'Print', '');
  }

  onTool(mapToolType: MapToolType = MapToolType.SELECTION, isDialog = false) {
    if(isDialog){
      this.activeDialogTools = [...this.activeDialogTools, mapToolType];
    }else{
      this.selectionService.setTool(mapToolType);
    }
    this.checkEnableTools();
    this.applicationInsightsService.logEvent('Map Tools', MapToolType[mapToolType] == null ? 'SELECTION_POINT' : MapToolType[mapToolType], '');
  }

  onTurnOffDialogTool(mapToolType: MapToolType) {
    const index =  this.activeDialogTools.findIndex(e=>e === mapToolType);
    if(index == -1){
      return;
    }
    this.activeDialogTools.splice(index, 1);
    this.activeDialogTools = this.activeDialogTools.slice(0);
    this.checkEnableTools();
  }

  checkEnableTools(activeMapTool = this.activeMapTool){
    const _enableTools = this._mapToolHelper.getEnableTools(this.activeDialogTools);
    if(_enableTools) {
      const enableTools: MapToolType[] = uniq([..._enableTools, ...[...this.activeDialogTools]]);
      if(!enableTools.includes(activeMapTool) && activeMapTool !== MapToolType.CLICK_MAP){
        this.selectionService.setTool(MapToolType.CLICK_MAP);
      }else if(activeMapTool === MapToolType.CLICK_MAP && enableTools.includes(MapToolType.SELECTION)){
        this.selectionService.setTool(MapToolType.SELECTION);
      }
      this.enableToolsOnly(enableTools);
    } else {
      this.enableAllTools();
      if(activeMapTool === MapToolType.CLICK_MAP){
        this.selectionService.setTool(MapToolType.SELECTION);
      }
    }
  }

  setTool(mapToolType: MapToolType) {
    this.timer = false;

    this.activeMapTool = mapToolType;
    if (this.drawingService.drawingManager) {
      this.drawingService.drawingManager.setDrawingMode(null);
    }

    this.selectionService.setToolSelection(mapToolType);

    switch (mapToolType) {
      case MapToolType.SHAPE_DELETE_ALL:
        this.selectionService.deleteAllShapes();

        this.overlayService.overlays.forEach(overlay => {
          if (overlay instanceof DrawingOverlay && !NOT_DRAWING_OVERLAYS.includes((<OVERLAY_TYPE>overlay.id))) {
            overlay.deleteShapes();
            this.selectionService.deselectLayer(overlay.id);
          }
        });
        setTimeout(() => this.onTool(), 500);
        break;
      case MapToolType.CHAT:
        (window as any).olark('api.box.expand');
        setTimeout(() => this.onTool(), 500);
        break;
      case MapToolType.FOLLOWME:
        this.onFollowMe();
        break;
      case MapToolType.INTERSECTION:
        this.onIntersection();
        break;
      case MapToolType.UNION:
        this.onUnion();
        break;
      case MapToolType.MARKER:
      case MapToolType.CIRCLE:
      case MapToolType.POLYGON:
      case MapToolType.POLYLINE:
      case MapToolType.RECTANGLE:
        this.drawingToolDefault = mapToolType;
        this.drawingService.drawingManager.setDrawingMode(<any>(
          MapToolType[mapToolType].toLowerCase()
        ));
        break;
    }

    this.changeRef.detectChanges();
  }

  hideInfo() {
    this.showInfo = false;
  }

  setCursor(cursor = null) {
    this.mapService.setMapCursor(CursorType.DEFAULT);
  }

  onFollowMe() {
    if (this.watchPositionId > 0) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = -1;
    }
    else {
      this.watchPositionId = navigator.geolocation.watchPosition(position => {
        this.mapService.showLocation(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          16,
          true
        );
      });
    }
    this.applicationInsightsService.logEvent('Map Tools', 'Follow Me', '');
  }

  onLocate() {
    navigator.geolocation.getCurrentPosition(position => {
      this.mapService.showLocation(
        {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        16,
        true
      );
    });
    this.applicationInsightsService.logEvent('Map Tools', 'Locate', '');
  }

  onLoading(value, type) {
    this.loadingIcon[type] = value;
    this.changeRef.detectChanges();
  }

  onIntersection() {
    const shapesObservables: Observable<any>[] = this.getSelectingShapes();
    forkJoin(shapesObservables)
      .pipe(map(x => x.reduce((a, b) => a.concat(b), [])))
      .subscribe((shapesSelected: OverlayShape[]) => {
        if (!this.checkShapeValid(shapesSelected)) {
          this.actionMessageService.sendWarning(`Selected invalid shapes. Please select Circle/Rectangle/Polygon only`);
          setTimeout(() => this.onTool(), 500);
          return;
        }
        let _shapes: { shape: OverlayShapeGeometry, length: number }[];
        if (shapesSelected.length > 1) {
          _shapes = shapesSelected.slice(0).map(e => {
            return [{
              shape: e.serializeWithType(),
              length: 1
            }]
          }).reduce((acc, curr, i, arr) => {
            let _reduceShapes = [];
            if (acc) {
              acc.forEach(e => {
                let _s = this.jstsOperatorService.intersection(e.shape, curr[0].shape);
                if (_s) {
                  _reduceShapes.push({
                    shape: _s,
                    length: e.length + 1
                  });
                }
              })
            } else {
              arr.splice(1);
            }
            return [...acc, ...curr, ..._reduceShapes];
          })
        }
        _shapes = _shapes.filter(e => e.length > 1);
        if (_shapes.length > 0) {
          if (_shapes.find(e => e.length > MAXINTERSECTED)) { // check maximum overlapping shapes
            this.actionMessageService.sendWarning(`Intersection operations are limited to ${MAXINTERSECTED} overlapping shapes. Please select fewer shapes.`);
            setTimeout(() => this.onTool(), 500);
          } else {
            let intersectedShapes = [];
            let overlay = <DrawingOverlay>this.overlayService.overlays.get('__DRAW');
            _shapes.map(e => e.shape).forEach(_shape => {
              let isEditable: boolean;
              if ([OverlayShapeType.Polygon, OverlayShapeType.MultiPolygon].includes(<any>OverlayShapeType[<any>_shape.type])) {
                isEditable = false;
              }
              const shape = overlay.addShapeByCoordinates(null, <any>OverlayShapeType[<any>_shape.type], _shape.coordinates, {
                isEditable: isEditable,
                isSelectable: true,
                zIndex: ZINDEX.INFOWINDOW
              });
              if (shape) {
                intersectedShapes.push(shape);
              }
            })
            this.selectionService.setToolSelection(MapToolType.SELECTION_REMOVE_ALL);
            intersectedShapes.forEach(shape => {
              this.selectionService.changeSelection({
                isAdd: true,
                overlayId: overlay.id,
                shapeId: shape.id
              });
            })
          }
        } else {
          this.actionMessageService.sendWarning('Please select shapes that overlap each other');
          setTimeout(() => this.onTool(), 500);
        }
      });
  }

  onUnion() {
    const shapesObservables: Observable<any>[] = this.getSelectingShapes();
    if (shapesObservables.length > MAXUNIONED) {
      this.actionMessageService.sendWarning(`Union operations are limited to ${MAXUNIONED} shapes. Please select fewer shapes.`);
      setTimeout(() => this.onTool(), 500);
    }
    forkJoin(shapesObservables)
      .pipe(map(x => x.reduce((a, b) => a.concat(b), [])))
      .subscribe((shapesSelected: OverlayShape[]) => {
        if (!this.checkShapeValid(shapesSelected)) {
          this.actionMessageService.sendWarning(`Selected invalid shapes. Please select Circle/Rectangle/Polygon only`);
          setTimeout(() => this.onTool(), 500);
          return;
        }
        if (shapesSelected.length < 2) {
          this.actionMessageService.sendWarning(`Please select more shapes to union`);
          setTimeout(() => this.onTool(), 500);
          return;
        }
        const unionShape: OverlayShapeGeometry = shapesSelected.slice(0).map(e => {
          return e.serializeWithType()
        }).reduce((pre, curr, i, arr) => {
          if (!pre) {
            arr.splice(1); // stop reduce
          }
          const newShape = this.jstsOperatorService.union(pre, curr);
          return newShape;
        })
        if (!unionShape) {
          this.actionMessageService.sendWarning(`Unhandled case!`);
          setTimeout(() => this.onTool(), 500);
          return;
        }

        //Remove just selected shapes
        this.overlayService.overlays.forEach(overlay => {
          if (overlay instanceof DrawingOverlay && overlay.id !== '__FILTER') {
            overlay.deleteSelectedShapes(shapesSelected.map(a => a.id));
            this.selectionService.deselectLayer(overlay.id);
          }
        });

        // create shape on map
        let resultShapes = [];
        let overlay = <DrawingOverlay>this.overlayService.overlays.get('__DRAW');
        let isEditable: boolean;
        if ([OverlayShapeType.Polygon, OverlayShapeType.MultiPolygon].includes(<any>OverlayShapeType[<any>unionShape.type])) {
          isEditable = false;
        }

        const shape = overlay.addShapeByCoordinates(null, <any>OverlayShapeType[<any>unionShape.type], unionShape.coordinates, {
          isEditable: isEditable,
          isSelectable: true,
          zIndex: ZINDEX.INFOWINDOW
        });
        if (shape) {
          resultShapes.push(shape);
        }
        this.selectionService.setToolSelection(MapToolType.SELECTION_REMOVE_ALL);
        resultShapes.forEach(shape => {
          this.selectionService.changeSelection({
            isAdd: true,
            overlayId: overlay.id,
            shapeId: shape.id
          });
        })
      });
  }

  checkShapeValid(shapes: OverlayShape[]) {
    if (shapes.map(e => e.type).filter(e =>
      [OverlayShapeType.Point,
      OverlayShapeType.MultiPoint,
      OverlayShapeType.LineString,
      OverlayShapeType.MultiLineString].includes(e)).length) {
      return false
    }
    return true
  }

  getSelectingShapes(): Observable<any>[] {
    const shapesObservables: Observable<any>[] = [];
    this.selectionService.selectionStore.forEach((shapes, layerId) => {
      if (shapes.size > 0) {
        const layer = this.layerService.layerStore.get(layerId);
        if (layer) {
          shapesObservables.push(
            this.layerDataService.getLayerDataGeomsForSelectedRecords(layer).pipe(
              map((x: any) => {
                return x.results.map(data => {
                  const geometry = data.geom || data.Geom;
                  const shape = OverlayShape.factory(
                    null,
                    <any>OverlayShapeType[<any>geometry.type],
                    { geometry: geometry.coordinates },
                    {},
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
            .filter(shape => shape);
          shapesObservables.push(of(collectedShapes));
        }
      }
    });
    return shapesObservables;
  }

  onQuickEdit() {
    try {
      if (this.selectedPointShapes > MAXQUICKEDIT) {
        this.actionMessageService.sendWarning(`Quick edit function is limited to ${MAXQUICKEDIT} points. Please select fewer points.`);
        return;
      }
      const shapesObservables: Observable<any>[] = this.getAllLayerShapes(true);
      if (this.quickEditSubscription) {
        this.quickEditSubscription.unsubscribe();
      }
      if (shapesObservables.length < 1) {
        this.actionMessageService.sendWarning(`Please select the points in active layer you want to edit and click the Quick Edit tool again.`);
        return;
      }
      this.onLoading(true, this.mapToolType[this.mapToolType.QUICKEDIT]);
      this.quickEditSubscription = forkJoin(shapesObservables)
        .pipe(map(x => x.reduce((a, b) => a.concat(b), [])))
        .subscribe((shapesSelected: OverlayShape[]) => {
          if (shapesSelected.map(e => e.type).filter(e => e !== OverlayShapeType.Point).length) {
            this.actionMessageService.sendError(`Quick edit function is support for POINT only.`);
            setTimeout(() => this.onTool(), 500);
          }
          const shapes: QuickEditShape[] = shapesSelected.map(e => {
            const { layerId, identifierColumnName, identifierColumnValue, layerName, geomColumnName, source, owner } = e.data;
            const id = e.id
            return {
              id,
              layerId,
              layerName,
              identifierColumnName,
              identifierColumnValue,
              geomColumnName,
              geomColumnValue: e.serializeWithType(),
              source,
              owner
            }
          })
          this.onLoading(false, this.mapToolType[this.mapToolType.QUICKEDIT]);
          this.quickEditService.innitModel({ shapes });
          this.openMapToolDialog(MapToolType.QUICKEDIT);
          this.changeRef.detectChanges();
        })
    } catch (error) {
      this.actionMessageService.sendWarning(decorateError(error).error.message);
    }
  }

  toggleNotifications() {
    if (this.activeDialogTools.includes(MapToolType.NOTIFICATION)) {
      this.closeDialogTool(MapToolType.NOTIFICATION);
    } else {
      this.openMapToolDialog(MapToolType.NOTIFICATION, {
        component: NotificationPopupComponent,
        title: 'Notification'
      });
    }
  }

  getAllLayerShapes(justActiveLayer: boolean = false): Observable<any>[] {
    const shapesObservables: Observable<any>[] = [];
    this.selectionService.selectionStore.forEach((shapes, layerId) => {
      if (justActiveLayer &&
        (!this.layerService.layerActiveStore ||
          (this.layerService.layerActiveStore && this.layerService.layerActiveStore.id != layerId))) {
        return;
      }
      if (shapes.size > 0) {
        const layer = this.layerService.layerStore.get(layerId);
        if (layer && layer.type === LayerType.POINT && layer.isEditable) {
          const indentifierColumnName = layer.columns.find(e => e.isIdentifier).id;
          const geomColumnName = layer.columns.find(e => e.isDefaultGeometry).id;
          shapesObservables.push(
            this.layerDataService.getLayerDataGeomsForSelectedRecords(layer).pipe(
              map((x: any) => {
                return x.results.map((data, index) => {
                  const geometry = data.geom || data.Geom;
                  const shape = OverlayShape.factory(
                    layerId + index,
                    <any>OverlayShapeType[<any>geometry.type],
                    { geometry: geometry.coordinates },
                    {
                      id: data[indentifierColumnName],
                      layerId: layer.id,
                      identifierColumnName: indentifierColumnName,
                      identifierColumnValue: data[indentifierColumnName],
                      layerName: layer.name,
                      geomColumnName: geomColumnName,
                      source: layer.source,
                      owner: layer.owner
                    },
                    null
                  );
                  shape.clean();
                  return shape;
                });
              })
            )
          );
        }
      }
    });
    return shapesObservables;
  }

  onToggleMapStyle() {
    this.expandMapStyle = !this.expandMapStyle;
    this.changeRef.detectChanges();
  }

  onToggleDrawingTool() {
    this.expandDrawingTool = !this.expandDrawingTool;
    this.changeRef.detectChanges();
  }
  calculateVH() {
    calculateVH();
  }

  onToggleDialogTool(event, mapToolType: MapToolType) {
    if(mapToolType === MapToolType.QUICKEDIT){
      this.onQuickEdit();
      return;
    }
    if (this.activeDialogTools.includes(mapToolType)) {
      this.closeDialogTool(mapToolType);
    } else {
      this.openMapToolDialog(mapToolType);
    }
  }

  openMapToolDialog(mapToolType: MapToolType, dynamicDialog?: IDynamicDialogData) {
    if (this.mapToolModalRef[mapToolType]) {
      return;
    }
    this.onTool(mapToolType, true);

    if (dynamicDialog) {
      const { component, data, position } = dynamicDialog;
      this.mapToolModalRef[mapToolType] = this.modalService.openModal(component, {...data, position}, undefined, false, true);
    } else {
      const data = this.getComponentDialog(mapToolType);
      this.mapToolModalRef[mapToolType] = this.modalService.openModal(DynamicDialogComponent, {
        ...data,
        data: {}
      } as IDynamicDialogData, { id: data.id, hasBackdrop: false }, true, true);
    }

    this.mapToolModalRef[mapToolType].afterClosed().pipe(first()).subscribe(res => {
      this.mapToolModalRef[mapToolType] = null;
      this.onTurnOffDialogTool(mapToolType);
      this.changeRef.detectChanges();
    })
    this.changeRef.detectChanges();
  }

  closeDialogTool(mapToolType: MapToolType) {
    if (this.mapToolModalRef[mapToolType]) {
      this.mapToolModalRef[mapToolType].close();
      this.changeRef.detectChanges();
    }
  }

  getComponentDialog(mapToolType: MapToolType): IDynamicDialogData {
    switch (mapToolType) {
      case MapToolType.SAVE_LOCATION:
        return {
          component: LocationFormContainerComponent,
          position: {
            x: window.innerWidth - 270,
            y: 52
          },
          title: 'Save Location',
          id: CommonDialogIds.LocationFormContainerComponent
        }
      case MapToolType.ROUTE_TOOL:
        return {
          component: RouteToolComponent,
          position: {
            x: window.innerWidth - 500,
            y: 52
          },
          title: 'Route and Directions'
        };
      case MapToolType.ISOGRAM:
        return {
          component: IsogramComponent,
          position: {
            x: window.innerWidth - (this._hasAdvancedCatchments ? 510 : 380),
            y: 52
          },
          title: 'Catchment',
          instructionsHTML: InfoTemplatesHelper.CATCHMENT_DIALOG
        };
      case MapToolType.MEASUREMENT_NEW:
        return {
          component: MeasurementComponent,
          position: {
            x: window.innerWidth - 340,
            y: 52
          },
          title: 'Measurement'
        }
      case MapToolType.REPORTS:
        return {
          component: ReportPanelComponent,
          position: {
            x: window.innerWidth - 405,
            y: 52
          },
          title: 'Reports',
          instructionsHTML: InfoTemplatesHelper.REPORT_DIALOG
        }
        break;
      case MapToolType.INSIGHTS:
        return {
          component: InsightToolComponent,
          position: {
            x: window.innerWidth - 490,
            y: 52
          },
          title: 'Insight',
          instructionsHTML: InfoTemplatesHelper.INSIGHT_DIALOG
        }
        break;
      case MapToolType.QUICKEDIT:
        return {
          component: QuickEditComponent,
          position: {
            x: window.innerWidth - 290,
            y: 52
          },
          title: 'Quick Edit'
        };
      case MapToolType.NEAREST:
        return {
          component: NearestMapToolComponent,
          position: {
            x: window.innerWidth - 590,
            y: 52
          },
          title: 'Nearest',
          instructionsHTML: InfoTemplatesHelper.NEAREST_DIALOG
        }
      default:
        throw new Error("Not Implemented!");
    }
    return null
  }

  initMapOsBranding(opts: { logo?, statement }) {
    const { logo, statement } = opts;
    let logoClassName = 'os-api-branding logo';
    if (logo === 'os-logo-maps-white') {
      logoClassName = 'os-api-branding logo white';
    }
    const copyrightStatement = (statement || '').replace('YYYY', new Date().getFullYear());
    this.removeOSBranding();
    // this.mapRef.nativeElement.querySelectorAll('.os-api-branding').forEach(el => el.remove());
    const div1 = document.createElement('div');
    div1.className = logoClassName;
    this.mapRef.nativeElement.appendChild(div1);
    var div2 = document.createElement('div');
    div2.className = 'os-api-branding copyright';
    div2.innerHTML = copyrightStatement;
    // this.mapService.
    // this.mapRef.nativeElement.appendChild(div2);
    this.mapService.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].clear();
    this.mapService.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(div2);
    if( div2.parentNode){
      div2.parentNode.querySelector('.gmnoprint').classList.add('hidden');
    }
    //const UK_BOUNDS = {
    //    north: 58.6350001085,
    //    south: 49.959999905,
    //    west: 1.68153079591,
    //    east: -7.57216793459,
    // };
    //this.mapService.map.setOptions({restriction: { latLngBounds: UK_BOUNDS, strictBounds: false}});
    this.mapService.map.setOptions({ minZoom: 6 });
  }

  removeOSBranding() {
    const div2 = this.mapRef.nativeElement.querySelector('.os-api-branding.copyright');
    if (div2) {
      div2.parentNode.querySelector('.gmnoprint').classList.remove('hidden');
    }
    this.mapService.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].clear();
    this.mapRef.nativeElement.querySelectorAll('.os-api-branding').forEach(el => el.remove());

    this.mapService.map.setOptions({ minZoom: 5 });
    //this.mapService.map.setOptions({restriction: null});

  }

  onOpenCrimeStatistic() {
    if (!this.crimeStatisticModalRef) {
      this.onTool(MapToolType.CRIME_STATISTIC);
      this.crimeStatisticModalRef = this.modalService.openModal(CrimeStatisticComponent);
      const subscribe = this.crimeStatisticModalRef.componentInstance.listeningMapClick.subscribe((value) => {
        if (value) {
          this.onTool(MapToolType.CRIME_STATISTIC);
        } else {
          this.onTool();
        }
      })
      this.crimeStatisticModalRef.afterClosed().pipe(first()).subscribe(res => {
        if (this.activeMapTool == MapToolType.CRIME_STATISTIC) {
          this.onTool();
          this.mapService.setMapCursor(CursorType.DEFAULT);
        }
        subscribe.unsubscribe();
        this.crimeStatisticModalRef = null;
        this.changeRef.detectChanges();
      })

      this.changeRef.detectChanges();
    } else {
      this.crimeStatisticModalRef.componentInstance.onRefresh();
    }
  }

  enableToolsOnly(tools: MapToolType[]) {
    this._mapToolService.enableToolsOnly(tools);
  }

  enableAllTools() {
    this._mapToolService.enableAllTools();
  }
}

