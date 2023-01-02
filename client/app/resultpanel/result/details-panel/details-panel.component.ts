import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, ViewEncapsulation, ViewChild } from '@angular/core';
import { EDetailPanelTabs, IGroup, IBranchDetail, IOpeningHours, OpeningHoursDay, OpeningHoursData, OpeningHoursPayStation, OpeningHoursPayStationDay, IOutreachServices, TypeOfImage } from '../../shared/models/detail-panel.model';
import { ILayerColumnType, OverlayShapeType } from '../../../shared/enums';
import { LayerDataService, SelectionService, AccountService, ActionMessageService, AppInsightsService, COLORS, OverlayShapeCircle, DrawingOverlay, OverlayService, OverlayShape, MapService, Projection } from '../../../shared';
import { BehaviorSubject, Subject, merge, Observable } from 'rxjs';
import { ILayer, ILayerColumn, ILayerColumnGroup, OverlayShapeOptions, IAccount } from '../../../shared/interfaces';
import { takeUntil } from 'rxjs/operators';
import { decorateError } from 'src/client/app/shared/http.util';
import { DetailPanelOutreachServicesService } from '../../shared/services/detail-panel-outreach-services.service';
import { NearestLocationsService } from '../../shared/services/nearest-locations.service';
import { NearestLocationsComponent } from './nearest-locations/nearest-locations.component';
import { StreetviewService } from '../../streetview/streetview.service';
import { DetailPanelService } from '../../shared/services/detail-panel.service';

@Component({
  selector: 'go-details-panel',
  templateUrl: './details-panel.component.html',
  styleUrls: ['./details-panel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DetailsPanelComponent implements OnInit {
  @ViewChild('nearestLocations') nearestLocations: NearestLocationsComponent
  @Input() layer: ILayer;
  @Input('refreshObservable') refresh$: Observable<void>;
  @Output() close = new EventEmitter<boolean>();
  isLoading$ = new BehaviorSubject<boolean>(false);
  activeTab: EDetailPanelTabs = EDetailPanelTabs.BranchDetails;
  openUpload = false;
  EDetailPanelTabs = EDetailPanelTabs;
  branchDetailModel: IBranchDetail;
  branchPeopleModel: IBranchDetail;
  outreachServicesData$ = new BehaviorSubject<IOutreachServices>(null);
  loadingDownload$ = new BehaviorSubject<boolean>(false);
  loadingDownloadNearest$ = new BehaviorSubject<boolean>(false);
  loadingGettingOutreachServices$ = new BehaviorSubject<boolean>(false);
  detailPanelData: any;
  openingHoursData: IOpeningHours;
  groupCollapse: { [groupId: string]: boolean } = {};
  shapeId: any;
  TypeOfImage = TypeOfImage;
  reportLocationOpen = false;
  submittingReportLocation$ = new BehaviorSubject<boolean>(false);
  crimeStatisticOpen = false;
  submittingCrimeStatistic$ = new BehaviorSubject<boolean>(false);
  centroid: { lat: number, lng: number };
  nearestFilter: string;
  private shapeRefs: Set<OverlayShape> = new Set();
  private shapeLastRef: OverlayShape;
  private overlay: DrawingOverlay;
  private unsubscribe$: Subject<void> = new Subject<void>();
  hasPOLSecurity = false;

  constructor(
    private layerDataService: LayerDataService,
    private selectionService: SelectionService,
    private actionMessageService: ActionMessageService,
    private changeDetectorRef: ChangeDetectorRef,
    private outreachServicesService: DetailPanelOutreachServicesService,
    private applicationInsightsService: AppInsightsService,
    private overlayService: OverlayService,
    private mapService: MapService,
    private accountService: AccountService,
    private nearestLocationsService: NearestLocationsService,
    private streetviewService: StreetviewService,
    private detailPanelService: DetailPanelService,
  ) {
    this.overlay = <DrawingOverlay>overlayService.overlays.get('__DATA');
  }

  ngOnInit() {
    this.accountService.account.pipe(takeUntil(this.unsubscribe$)).subscribe((item: IAccount) => {
      this.hasPOLSecurity = item.hasPOLSecurity;
    });
    this.getBranchData();
    if (this.refresh$) {
      this.refresh$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        this.getBranchData();
      });
    }
  }

  ngOnDestroy(): void {
    this.overlay.deleteShapes();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onSelectTab(tab: EDetailPanelTabs) {
    this.activeTab = tab;
    this.applicationInsightsService.logEvent('Details Panel', this.activeTab, '');
    this.changeDetectorRef.detectChanges();
  }
  onToggle(index: number) {
    this.groupCollapse[index] = !this.groupCollapse[index];
    this.changeDetectorRef.detectChanges();
  }
  createBranchDetail(item: any) {
    if (!this.layer) return;
    this.branchDetailModel = { groups: [], name: item.name };
    const layer = this.decorateLayer(this.layer);
    layer.columnGroups.forEach(group => {
      if (group.Name == 'Opening Hours') { // Branch Detail
        this.openingHoursData = this.createOpeningHours(item, group);
      }
      else if (group.Name == '(Reserved)') {
        let _group: IGroup = {
          name: group.Name,
          details: []
        }

      } else if (group.Name == 'Branch People') {
        let _group: IGroup = {
          name: group.Name,
          details: []
        }

        group.children.forEach(column => {
          if (column.groupId >= 0) {
            if (!(column.isIdentifier || column.notFilterable || column.notSelectable || column.type === ILayerColumnType.SHAPE)) {
              _group.details.push(this.createDetail(column, item));
            }
          }
        })

        if (_group.details.length > 0) {
          this.branchPeopleModel = {
            name: item.name,
            groups: [_group]
          }
        }
      } else {
        let _group: IGroup = {
          name: group.Name,
          details: []
        }
        group.children.forEach(column => {
          if (column.groupId >= 0) {
            if (!(column.isIdentifier || column.notFilterable || column.notSelectable || column.type === ILayerColumnType.SHAPE)) {
              _group.details.push(this.createDetail(column, item));
            }
          }
        })
        if (_group.details.length > 0) {
          this.branchDetailModel.groups.push(_group);
        }
      }
    })
    this.changeDetectorRef.detectChanges();
  }

  createOpeningHours(item: any, columnGroup: ILayerColumnGroup): IOpeningHours {
    const { BranchName } = item;
    const model: IOpeningHours = {
      name: BranchName,
      datas: [],
      payStationDatas: [],
      hours: item['Hours']
    }
    Object.keys(OpeningHoursDay).forEach(day => {
      const columns = columnGroup.children.filter(col => col.id.startsWith(OpeningHoursDay[day]));
      const data: { [key: string]: any } = {};
      Object.keys(OpeningHoursData).forEach(_e => {
        const col = columns.find(e => e.id.endsWith(OpeningHoursData[_e]));
        data[OpeningHoursData[_e]] = col ? item[col.id] : null;
      })
      data['Day'] = day.toLocaleUpperCase();
      model.datas.push({ ...data });
    })
    //if (item['PaystationHoursPresent']) {
    //  Object.keys(OpeningHoursPayStationDay).forEach(day => {
    //    const columnsPayStation = columnGroup.children.filter(col => col.id.startsWith(OpeningHoursPayStationDay[day]));
    //    const payStationDatas: { [key: string]: any } = {};
    //    Object.keys(OpeningHoursPayStation).forEach(_e => {
    //      const col = columnsPayStation.find(e => e.id.endsWith(_e));
    //      if (col)
    //        payStationDatas[_e] = col ? item[col.id] : null;
    //    })
    //    if (Object.keys(payStationDatas).length) {
    //      payStationDatas['Day'] = day.toLocaleUpperCase();
    //      model.payStationDatas.push({ ...payStationDatas });
    //    }
    //  })
    //}
    return {
      ...model
    }
  }

  getBranchData() {
    if (!this.layer) {
      return;
    }
    this.setLoading(true);
    const shapeId = this.selectionService.getLayerActiveShapeId(this.layer.id);
    this.shapeId = shapeId;
    this.getOutReachServices();
    this.layerDataService.getRecordDetail(this.layer, shapeId).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(data => {
      this.detailPanelData = data.detail;
      const geometry = this.detailPanelData['CentroidGeom'];
      if (geometry) {
        const { coordinates } = geometry
        this.centroid = {
          lat: coordinates[1],
          lng: coordinates[0]
        }
      }
      this.createBranchDetail(data.detail);
      this.createEditShape(data.detail);
      this.setLoading(false);
      this.changeDetectorRef.detectChanges();
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.setLoading(false);
      this.changeDetectorRef.detectChanges();
    });
  }

  decorateShape(data: any) {
    const geomColumn = this.layer.columns.find(column => column.type === ILayerColumnType.SHAPE && column.isDefaultGeometry);
    if (geomColumn) {
      const value = data[geomColumn.id] !== undefined ? data[geomColumn.id] : null;
      if (value) {
        let type: OverlayShapeType;
        let coordinates: any;
        if (value.isCircle) {
          type = OverlayShapeType.Circle;
          coordinates = OverlayShapeCircle.getGeometry(value.coordinates);
        } else {
          type = <any>OverlayShapeType[value.type];
          coordinates = value.coordinates;
        }
        return { type, coordinates };
      }
    }
    return null;
  }

  createEditShape(data: any) {
    const _shape = this.decorateShape(data);
    if (_shape) {
      const { type, coordinates } = _shape;
      // const opts: OverlayShapeOptions = {
      //   isEditable: false,
      //   isSelectable: true,
      //   fillColor: COLORS.MAP_EDIT,
      //   strokeColor: COLORS.MAP_EDIT_STROKE,
      //   transparency: COLORS.MAP_EDIT_TRANSPARENCY,
      //   strokeWeight: COLORS.MAP_EDIT_STROKE_WEIGHT,
      //   zIndex: google.maps.Marker.MAX_ZINDEX * 2,
      //   iconSize: 24,
      //   geometry: coordinates,
      //   isDisplayStrokePoint: true,
      //   strokeDasharray: '1 2'
      // };
      const opts: OverlayShapeOptions = OverlayShape.getEditShapeOptions(type, {
        isEditable: false,
        iconSize: 24,
        geometry: coordinates
      });
      const shape = this.overlay.addShapeByCoordinates(null, type, coordinates, opts);
      this.mapService.zoomBounds(shape.getBounds());
    }
  }

  decorateLayer(layer: ILayer): ILayer {
    const activeLayer = Object.assign({}, layer);
    activeLayer.columnGroups.map(item => {
      item.expanded = true;
      return item.children = [];
    });
    activeLayer.columns.forEach((item) => {
      if (item.groupId >= 0) {
        if (!(item.notFilterable || item.notSelectable || (item.type === ILayerColumnType.SHAPE && !item.isDefaultGeometry))) {
          const idx = (item.groupId) ? item.groupId : 0;

          let grp = activeLayer.columnGroups[idx];

          if (!(grp)) {
            activeLayer.columnGroups[idx] = {
              Index: idx,
              Name: '',
              Description: '',
              HasTotal: false,
              children: <ILayerColumn[]>[],
              expanded: false
            };
            grp = activeLayer.columnGroups[idx];
          }
          const format = item.format !== null ? item.format.slice(0) : null;
          item['formatPipe'] = format !== null ? format[0] : null;
          item['_format'] = format !== null ? format.slice(1) : null;
          grp.children.push(item);
        }
        item.expanded = true;
      }
    });
    if (activeLayer.columnGroups.filter(e => e).length != activeLayer.columnGroups.length) {
      this.actionMessageService.sendError("Columns are assigned to a Group that doesn't exist.")
    }
    return activeLayer;
  }

  createDetail(column: ILayerColumn, item) {
    const detail = {
      name: column.name,
      value: item[column.id],
      format: null,
      formatPipe: null
    }
    if (column.format) {
      detail.formatPipe = column.format[0];
      detail.format = column.format.slice(1);
    } else if (column.type === ILayerColumnType.DATE) {
      detail.format = ['dd/MM/yyyy'];
      detail.formatPipe = 'date';
    } else if (column.isPercentage) {
      detail.value = detail.value / 100;
      detail.format = ['1.1-1'];
      detail.formatPipe = 'percent';
    } else if (column.type === ILayerColumnType.NUMBER && !column.isIdentifier) {
      detail.formatPipe = 'number';
    }
    return detail;
  }

  setLoading(value: boolean) {
    this.isLoading$.next(value);
  }

  onClose() {
    this.close.emit(true);
  }
  onToggleUploadImage() {
    this.openUpload = !this.openUpload;
    this.changeDetectorRef.detectChanges();
  }

  getOutReachServices() {
    this.loadingGettingOutreachServices$.next(true);
    this.outreachServicesService.getOutReachServices(this.shapeId).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(data => {
      this.loadingGettingOutreachServices$.next(false);
      this.outreachServicesData$.next(data);
    }, err => {
      this.loadingGettingOutreachServices$.next(false);
      this.actionMessageService.sendError(decorateError(err).error.message);
    })
  }

  onDownloadOutreachServices() {
    this.applicationInsightsService.logEvent('Details Panel', 'Outreach Services', 'Download Opening Times');
    this.loadingDownload$.next(true);
    this.changeDetectorRef.detectChanges();
    this.outreachServicesService.getReport(this.shapeId).subscribe(e => {
      this.loadingDownload$.next(false);
      this.changeDetectorRef.detectChanges();
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.loadingDownload$.next(false);
      this.changeDetectorRef.detectChanges();
    });
  }
  onDownloadNearest() {
    this.applicationInsightsService.logEvent('Details Panel', 'Nearest Locations by Function', 'Download Nearest');
    this.nearestLocations.onDownload();
    this.changeDetectorRef.detectChanges();
  }
  onNearestFilter(filter) {
    this.nearestFilter = filter;
    this.changeDetectorRef.detectChanges();
  }

  onClickReportLocation() {
    this.reportLocationOpen = !this.reportLocationOpen;
    this.changeDetectorRef.detectChanges();
  }
  onCloseReportLocation() {
    this.reportLocationOpen = false;
    this.changeDetectorRef.detectChanges();
  }


  onSaveReportLocation(data: { locationCoordinates: any }) {
    const newLocationCoordinates = data.locationCoordinates;
    const fadCode = this.detailPanelData.FadCode;
    const branchName = this.detailPanelData.BranchName;
    this.submittingReportLocation$.next(true);
    const bng = new Projection().ConvertWGS84toBNG(newLocationCoordinates[1], newLocationCoordinates[0]);
    const newLocationCoordinatesBNG = `${bng.easting}, ${bng.northing}`;
    const newLocationCoordinatesLatLng = `${newLocationCoordinates[1]}, ${newLocationCoordinates[0]}`;
    this.detailPanelService.reportLocation({ fadCode, branchName, newLocationCoordinatesBNG, newLocationCoordinatesLatLng }).subscribe(res => {
      this.actionMessageService.sendSuccess(`Your new location suggestion for ${branchName} has been reported for verification`);
      this.onCloseReportLocation();
      this.submittingReportLocation$.next(false);
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.submittingReportLocation$.next(false);
    })
  }

  // onClickCrimeStatistic() {
  //   this.crimeStatisticOpen = !this.crimeStatisticOpen;
  //   this.changeDetectorRef.detectChanges();
  // }
  // onCloseCrimeStatistic() {
  //   this.crimeStatisticOpen = false;
  //   this.changeDetectorRef.detectChanges();
  // }

  // onGetCrimeStatistic(data: { locationCoordinates: any }) {
  //   const newLocationCoordinates = data.locationCoordinates;
  //   this.submittingCrimeStatistic$.next(true);
  //   this.detailPanelService.getCrimeStatistic({ lat: newLocationCoordinates[1], lng: newLocationCoordinates[0] }).subscribe(res => {
  //     console.log(res);

  //     this.submittingCrimeStatistic$.next(false);
  //     this.onCloseCrimeStatistic();
  //   }, err => {
  //     this.actionMessageService.sendError(decorateError(err).error.message);
  //     this.submittingCrimeStatistic$.next(false);
  //   })
  // }

  onNearestDownloading(value: boolean) {
    this.loadingDownloadNearest$.next(value);
    this.changeDetectorRef.detectChanges();
  }
  onStreetView() {
    this.streetviewService.setShapeLocation({
      layerId: this.layer.id,
      shapeId: this.shapeId
    });
    this.applicationInsightsService.logEvent('result edit', 'Street View', '');
  }
}
