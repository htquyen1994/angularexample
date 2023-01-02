import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ChangeDetectorRef } from '@angular/core';
import { IOutreachServices } from '../../../shared/models/detail-panel.model';
import { GoTableColumn } from '@periscope-lib/table/table.model';
import { Helper } from 'src/client/app/shared/meassure-tool/helper';
import { MeasureToolService } from 'src/client/app/map/services/measure-tool.service';
import { AccountService, MapService, ICONS_PATH, ICONS, OverlayShapePoint, AppInsightsService } from 'src/client/app/shared';
import { takeUntil } from 'rxjs/operators';
import { Subject, fromEvent, BehaviorSubject, Observable } from 'rxjs';
import { IAccount } from 'src/client/app/shared/interfaces';
import { UnitTypeId } from 'src/client/app/shared/meassure-tool/UnitTypeId';
import { DirectionsService } from 'src/client/app/shared/services/directions.service'

@Component({
  selector: 'ps-outreach-services',
  templateUrl: './outreach-services.component.html',
  styleUrls: ['./outreach-services.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DirectionsService]
})
export class OutreachServicesComponent implements OnInit {
  @Input('active') set active(value: boolean) {
    if (value && this._data.getValue()) {
      const data = this._data.getValue();
      this._data.next({
        ...data,
        outreaches: [...data.outreaches]
      }) //force detect change
      this.cd.detectChanges();
    }
  }
  @Input('data')
  set data(value: IOutreachServices) {
    if (!value) return
    this._data.next({
      ...value,
      outreaches: [...value.outreaches]
    }) //force detect change
    this.directionsService.reset();
    this.checkDisabledShowAll();
    this.setOption('unit', this.isMetric ? UnitTypeId.METRIC : UnitTypeId.IMPERIAL);
    this.cd.detectChanges();
  };

  get data() {
    return this._data.getValue();
  }
  @Input() loading: boolean;
  @Input() public headers: GoTableColumn[] = [
    { name: 'FAD code', trackBy: 'fadCode', class: 'w-15 text-truncate' },
    { name: 'Location', trackBy: 'location', class: 'w-30 text-truncate' },
    { name: 'Type', trackBy: 'type', class: 'w-20 text-truncate' },
    { name: 'Postcode', trackBy: 'postcode', class: 'w-15 text-truncate' },
    { name: 'Distance to Core', trackBy: '_distanceMetres', class: 'w-20 text-truncate' },
    { name: '', trackBy: '', class: 'action-column' },
  ];
  public _data:  BehaviorSubject<IOutreachServices> = new BehaviorSubject<IOutreachServices>(null);
  private _helper: Helper;
  private unsubscribe$: Subject<void> = new Subject<void>();
  isMetric: any;
  markerArray: google.maps.Marker[] = [];
  stepDisplay = new google.maps.InfoWindow();
  isShowAll = false;
  disabledShowAll = true;
  public UnitTypeId = UnitTypeId;
  public selectedTravelMode$: Observable<google.maps.TravelMode>;
  public reverseDirection$: Observable<boolean>;
  public selectedRouteData$: Observable<any>;
  constructor(
    private accountService: AccountService,
    private cd: ChangeDetectorRef,
    private directionsService: DirectionsService,
    private mapService: MapService,
    private applicationInsightsService: AppInsightsService
  ) {
    this.selectedTravelMode$ = this.directionsService.selectedTravelMode$;
    this.reverseDirection$ = this.directionsService.reverseDirection$;
    this.selectedRouteData$ = this.directionsService.selectedRoute$;
  }

  ngOnInit(): void {

    this.applicationInsightsService.logEvent('Details Panel', 'Outreach Services', '');
    this._helper = new Helper({
      unit: UnitTypeId.METRIC
    });
    this.accountService.account.pipe(takeUntil(this.unsubscribe$)).subscribe((item: IAccount) => {
      if (this.isMetric != item.isMetric) {
        this.isMetric = item.isMetric;
        this.onChangeMetric();
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.hideAllLocations();
    this.hideRoutePath();
  }

  reset(){
    this.directionsService.reset();
    if(this.isShowAll){
      this.onToggleShowAll();
    }
    this.markerArray = [];
    this.hideRoutePath();
  }

  checkDisabledShowAll() {
    this.disabledShowAll = true;
    if (this.data && this.data.outreaches && this.data.outreaches.length) {
      if (this.data.outreaches.find(e => e.outreachLat && e.outreachLng)) {
        this.disabledShowAll = false;
      }
    }
  }

  onChangeMetric() {
    this.setOption('unit', this.isMetric ? UnitTypeId.METRIC : UnitTypeId.IMPERIAL);
  }

  setOption(option, value) {
    if (this._helper._options[option]) {
      this._helper.setOption(option, value);
    }
    if (this.data && this.data.outreaches && this.data.outreaches.length) {
      this.data.outreaches = [...this.data.outreaches.map(e => ({ ...e, _distanceMetres: this._helper.formatLength(e['distanceMetres'] || 0) }))]
    }
  }

  showRoutePath(data) {
    if (!(data.outreachLat && data.outreachLng)) {
      return;
    }
    const ends = [{
      fadCode: data.fadCode,
      latlng: new google.maps.LatLng(data.outreachLat, data.outreachLng),
    }]
    this.directionsService.calcRoute(
      new google.maps.LatLng(this.data.coreLat, this.data.coreLng),
      ends
    )
  }

  hideRoutePath() {
    this.directionsService.clearRoute();
    this.directionsService.onSelectedRoute(null);
  }

  onToggleShowAll() {
    this.isShowAll = !this.isShowAll;
    this.cd.detectChanges();
    if (this.isShowAll) {
      this.showAllLocations();
    } else {
      this.hideAllLocations();
    }
  }

  showAllLocations() {
    const bounds = new google.maps.LatLngBounds();
    const position = new google.maps.LatLng(this.data.coreLat, this.data.coreLng);
    const marker: google.maps.Marker =
      (this.markerArray[0] = this.markerArray[0] ||
        new google.maps.Marker(this.getOptionsMarker(position, '#3a4766', 2)));
    marker.setMap(this.mapService.map);
    bounds.extend(position);
    this.data.outreaches.forEach((data, i) => {
      if (!(data.outreachLat && data.outreachLng)) return;
      const position = new google.maps.LatLng(data.outreachLat, data.outreachLng)
      var marker: google.maps.Marker =
        (this.markerArray[i + 1] = this.markerArray[i + 1] ||
          new google.maps.Marker(this.getOptionsMarker(position, '#333333')));
      marker.setMap(this.mapService.map);
      marker.addListener('click', () => this.onMarkerClick(data));
      bounds.extend(position)
    })
    this.mapService.zoomBounds(bounds);
  }

  hideAllLocations() {
    for (var i = 0; i < this.markerArray.length; i++) {
      google.maps.event.clearInstanceListeners(this.markerArray[i]);
      this.markerArray[i].setMap(null);
    }
  }

  // onRowSelect(event) {
  //   const { row, rowIndex } = event;
  //   this.onSelected(row);
  // }

  onMarkerClick(data) {
    this.onSelected(data);
  }

  onSelected(data) {
    const index = this.data.outreaches.findIndex(e => e.fadCode == data.fadCode);
    if (index != -1) {
      const currentSelected = this.data.outreaches[index].isSelected;
      this.data.outreaches.forEach(e => e.isSelected = false);
      this.data.outreaches[index].isSelected = !currentSelected;
      if (this.data.outreaches[index].isSelected) {
        this.showRoutePath(data);
      } else {
        this.hideRoutePath();
      }
      this.data.outreaches = [...this.data.outreaches];
      this.cd.detectChanges();
    }
  }

  getOptionsMarker(position, fillColor = "#333333", scale = 1) {
    let icon = {};
    let _icon = <google.maps.Symbol>{
      path: ICONS_PATH[ICONS.PLACE],
      scale,
      fillColor,
      fillOpacity: 1,
    };

    let style = `fill: ${OverlayShapePoint.hexToRgbA(_icon.fillColor)};stroke-width: ${_icon.strokeWeight};opacity: ${_icon.fillOpacity};transform: scale(1)`
    icon = {
      url: `data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" style="${style}"><path d="${_icon.path}"></path></svg>`,
      size: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
      scaledSize: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
      anchor: new google.maps.Point(24 * _icon.scale / 2, 24 * _icon.scale / 2)
    };

    return {
      position,
      icon
    } as google.maps.MarkerOptions
  }

  clearRoute() {
    this.directionsService.clearRoute();
  }

  onSelectedTravelMode(mode: google.maps.TravelMode) {
    this.directionsService.selectTravelMode(mode);
  }

  onReverseDirection() {
    this.directionsService.onReverseDirection();
  }

  getOutreachData(){
    return this.data;
  }
}
