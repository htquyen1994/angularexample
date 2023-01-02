import { Component, OnInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef, ViewEncapsulation, QueryList, ViewChildren, Renderer2, Input } from '@angular/core';
import { ReviewModel, ReviewModelGridRow, ReviewModelGridHeader, ReviewModelGridHeaderGroup } from '../../shared/models/match-it-review.model';
import { MapService, PanelService, DEFAULT_OPACITY, COLORS, MATCH_DEFAULT_OPACITY, MATCH_DEFAULT_COLOR } from '../../../shared';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatchItGeometry } from '../../shared/models/match-it-geojson.model';
import { ROADMAP_BW_STYLE, ROADMAP_POI_STYLE, SIMPLE_MAP_STYLE } from '../../../map/map.styles';
import { Subject, Observable } from 'rxjs';
import { Table } from 'primeng/table';
import { PanelStoreService } from '@client/app/core/services';

@Component({
  selector: 'go-match-it-review',
  templateUrl: './match-it-review.component.html',
  styleUrls: ['./match-it-review.component.less'],
  encapsulation: ViewEncapsulation.None,
})
export class MatchItReviewComponent implements OnInit {
  @ViewChild('map', { static: true }) mapRef: ElementRef;
  @ViewChild('table') table: Table;
  @ViewChildren("row", { read: ElementRef }) rowElement: QueryList<ElementRef>;
  @Input('reviewData') set _reviewData(data: ReviewModel){
    if (data) {
      this.reviewData = data;
      if(!this.map){
        this.initMap();
      }
      const { gridRows, gridHeader, gridHeaderGroup, geoJsonObjects, center } = data;
      this.ngZone.run(() => {
        this.innitTable(gridRows, gridHeader, gridHeaderGroup, () => {
          this.onPaginate(1);
          this.featureIdSelected = null;
          this.setSelectedRow(0);
          this.onRowSelect({ index: 0 });
          this.refreshTable();
        });
      })
    }
  };
  @Input() loading: boolean;
  reviewData: ReviewModel
  map: google.maps.Map;
  geoJSON: any;
  currentFeatures: google.maps.Data.Feature[];
  cols: { header: string, id: string, align: string, type: string, isPercentage: boolean, formatPipe: string, format: string }[];
  colGroups: { id: number, name: string, colspan: number }[];
  values: any[];
  selectedRow: any;
  featureIdSelected: number = null;
  pageNumberNext: number = null;
  pageNumber: number = 0;
  maxPages: number = 0;
  valuesDisplay: any[];
  private unsubscribe$: Subject<void> = new Subject<void>();
  private clickListener: any;
  private listenClick: any;
  constructor(
    private ngZone: NgZone,
    // private matchItPreviewService: MatchItPreviewService,
    private changeDetectorRef: ChangeDetectorRef,
    private mapService: MapService,
    private panelService: PanelService,
    private renderer: Renderer2,
    private _panelStoreServices: PanelStoreService

  ) {
  }

  ngOnInit() {
  }


  ngOnDestroy(): void {
    if (this.clickListener) {
      google.maps.event.removeListener(this.clickListener);
    }
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    // this.matchItPreviewService.nextReviewData(null);
    if (this.listenClick) {
      this.listenClick = null;
    }
  }

  initMap(){
    this.map = this.ngZone.runOutsideAngular(() => {
      const map = this._initMap();
      this.clickListener = map.data.addListener('click', (event) => {
        let feature = event.feature as google.maps.Data.Feature;
        let index = feature.getId();
        this.toggleSelectFeature(feature, index)
      })
      return map
    })
    this.map.mapTypes.set('roadmap_bw', ROADMAP_BW_STYLE);
    this.map.mapTypes.set('roadmap_poi', ROADMAP_POI_STYLE);
    this.map.mapTypes.set('simple_map', SIMPLE_MAP_STYLE);
    this.mapService.mapStyle.pipe(takeUntil(this.unsubscribe$)).subscribe(type => {
      this.map.setMapTypeId(type);
    })
    this._panelStoreServices.resultPanelState$.pipe(
      debounceTime(50),
      takeUntil(this.unsubscribe$),
    ).subscribe(_ => {
      this.valuesDisplay = Object.assign([], this.valuesDisplay);  // to detechchange
      this.changeDetectorRef.detectChanges();
      this.panelService.detechChange();
    })
    // this.matchItPreviewService.zoomAll.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
    //   this.zoom(this.map);
    // })
  }

  loadGeoJsonString(geoJsonObjects: MatchItGeometry[]) {
    let features = [];
    geoJsonObjects.forEach((geo, i) => {
      let color = MATCH_DEFAULT_COLOR;
      features.push({
        "type": "Feature",
        "properties": {
          "color": color,
          "index": i + 1,
          "active": false
        },
        "geometry": geo
      })
    })
    var geojson = {
      "type": "FeatureCollection",
      "features": features
    };
    this.currentFeatures = this.map.data.addGeoJson(geojson, { idPropertyName: "index" });
    this.setStyle();
    this.zoom(this.map);
  }

  zoom(map) {
    var bounds = new google.maps.LatLngBounds();
    map.data.forEach((feature) => {
      this.processPoints(feature.getGeometry(), bounds.extend, bounds);
    });
    map.fitBounds(bounds);
  }

  zoomFeature(map: google.maps.Map, index: number) {
    var bounds = new google.maps.LatLngBounds();
    let feature = map.data.getFeatureById(index + 1);
    if (feature) {
      this.processPoints(feature.getGeometry(), bounds.extend, bounds);
      this.setActiveFeature(feature, true);
      map.fitBounds(bounds);
    }
  }

  toggleSelectFeature(feature: google.maps.Data.Feature, index: string | number) {
    if (typeof index == 'string') {
      index = parseInt(index); // featureId is index + 1
    }
    index = index - 1;
    if (this.featureIdSelected != index) {
      if (this.featureIdSelected != null) {
        this.onRowUnselect({ index: this.featureIdSelected });
      }
      this.featureIdSelected = index;
      this.setActiveFeature(feature, true);
      this.setSelectedRow(index);
      this.scrollToElement(index);
    } else {
      this.onRowUnselect({ index: this.featureIdSelected });
      this.setSelectedRow(null);
    }
  }

  setActiveFeature(feature: google.maps.Data.Feature, active: boolean) {
    feature.setProperty('active', active);
    this.overideStyle(feature);
  }

  setSelectedRow(index = null) {
    if (index != null) {
      this.selectedRow = this.valuesDisplay[index];
    } else {
      this.selectedRow = null;
    }
    this.changeDetectorRef.detectChanges();
  }

  onRowSelect(event: { index: number }) {
    if (this.featureIdSelected != null) {
      this.onRowUnselect({ index: this.featureIdSelected });
    }
    this.featureIdSelected = event.index;
    this.zoomFeature(this.map, event.index);
  }

  onRowUnselect(event: { index: number }) {
    let feature = this.map.data.getFeatureById(this.featureIdSelected + 1);
    if (feature) {
      this.setActiveFeature(feature, false);
      this.featureIdSelected = null;
    }
  }

  scrollToElement(id: number) {
    const el = this.rowElement.find(r => r.nativeElement.getAttribute("row-index") == id);
    if (el)
      el.nativeElement.scrollIntoView({ behavior: "auto", inline: "start", block: "start" });
  }

  private _initMap() {
    var map = new google.maps.Map(this.mapRef.nativeElement, {
      zoom: 4,
      center: { lat: 0, lng: 0 },
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      fullscreenControl: false,
      mapTypeControl: false,
      maxZoom: 19,
      minZoom: 5,
      tilt: 45,
    });
    let controlDiv = this.renderer.createElement('div');
    this.centerControl(controlDiv, map);
    controlDiv.index = 1;
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controlDiv);

    let textDiv = this.createControlUI('Preview of current page of results', { fontSize: '12px', lineHeight: '12px' });
    textDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(textDiv);
    return map;
  }

  private processPoints(geometry, callback, thisArg) {
    if (geometry instanceof google.maps.LatLng) {
      callback.call(thisArg, geometry);
    } else if (geometry instanceof google.maps.Data.Point) {
      callback.call(thisArg, geometry.get());
    } else {
      geometry.getArray().forEach((g) => {
        this.processPoints(g, callback, thisArg);
      });
    }
  }

  private getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  private innitTable(gridRows: ReviewModelGridRow[],
    gridHeader: ReviewModelGridHeader[], gridHeaderGroup: ReviewModelGridHeaderGroup[], callback?: Function) {
    this.cols = [];
    this.values = [];
    this.colGroups = [];
    let _gridHeader = gridHeader.filter(e => !e.isHidden);
    gridHeaderGroup.forEach(group => {
      this.colGroups.push({
        id: group.groupId,
        name: group.groupName,
        colspan: 0
      })
    })
    _gridHeader.forEach(header => {
      let align = 'right';
      let type = 'default';
      if (header.columnShortId == 'Location') {
        align = 'left';
      }
      if (header.isPercentage) {
        type = 'percent'
      } else if (header.columnFormat) {
        type = 'format'
      }
      this.cols.push({
        header: header.columnValue,
        id: header.columnShortId,
        align: align,
        type: type,
        isPercentage: header.isPercentage,
        formatPipe: header.columnFormat ? header.columnFormat[0] : null,
        format: header.columnFormat ? header.columnFormat.slice(1) : null,
      })
      let groupIndex = this.colGroups.findIndex(e => e.id == header.groupId);
      if (groupIndex != -1) {
        this.colGroups[groupIndex].colspan++;
      }
    })
    gridRows.forEach((row, index) => {
      let value = Object.create({});
      value['index'] = index;
      row.columnCells.forEach((data, i) => {
        value[data.columnShortId] = data.columnValue;
      })
      this.values.push(value);
    })
    this.colGroups = this.colGroups.filter(e => e.colspan);
    if (callback) callback();
  }

  private refreshTable() {
    setTimeout(() => {
      let headerTable = this.table.el.nativeElement.querySelector('.p-datatable-scrollable-header-table');
      let bodyTable = this.table.el.nativeElement.querySelector('.p-datatable-scrollable-body table');
      let header = headerTable.querySelector('.p-datatable-thead');
      let body = bodyTable.querySelector('.p-datatable-tbody');
      let header_clone = header.cloneNode(true);
      let body_clone = body.cloneNode(true);
      this.addClass(header_clone, 'visibility-collapse');
      this.addClass(body_clone, 'visibility-collapse');
      let oldbodyClone = headerTable.querySelector('.p-datatable-tbody');
      let oldheaderClone = bodyTable.querySelector('.p-datatable-thead');
      if (oldbodyClone) {
        headerTable.removeChild(oldbodyClone);
      }
      if (oldheaderClone) {
        bodyTable.removeChild(oldheaderClone);
      }
      bodyTable.appendChild(header_clone);
      headerTable.appendChild(body_clone);
    }, 0);
  }

  private addClass(element: any, className: string): void {
    if (element.classList)
      element.classList.add(className);
    else
      element.className += ' ' + className;
  }

  private setStyle() {
    this.map.data.setStyle((feature) => {
      const color = feature.getProperty('color');
      const active = feature.getProperty('active');
      if (active) {
        return {
          fillColor: COLORS.MAP_ACTIVE,
          strokeWeight: 1,
          fillOpacity: 0.8
        };
      } else {
        return {
          fillColor: color,
          strokeWeight: 1,
          fillOpacity: MATCH_DEFAULT_OPACITY
        };
      }
    })
  }

  private overideStyle(feature: google.maps.Data.Feature) {
    const active = feature.getProperty('active');
    const color = feature.getProperty('color');
    let style = {
      fillColor: color,
      strokeWeight: 1,
      fillOpacity: MATCH_DEFAULT_OPACITY
    };
    if (active) {
      style = {
        fillColor: COLORS.MAP_ACTIVE,
        strokeWeight: 1,
        fillOpacity: 0.8
      };
    }
    this.map.data.overrideStyle(feature, style)
  }
  onPreviousPage() {
    this.onPaginate(this.pageNumber);
  }
  onNextPage() {
    if (this.pageNumberNext <= this.maxPages) {
      this.onPaginate(this.pageNumberNext);
    }
  }
  onPaginate(curentPage: number, numberRecord: number = 25) {
    if (this.values) {
      this.maxPages = Math.ceil(this.values.length / numberRecord);
      this.pageNumber = curentPage - 1;
      this.valuesDisplay = Object.assign([], this.values).slice((curentPage * numberRecord) - numberRecord, curentPage * numberRecord);
      this.pageNumberNext = curentPage >= this.maxPages ? this.maxPages : curentPage + 1;
      this.refreshMap();
      let geoJsonObjectsDisplay = Object.assign([], this.reviewData.geoJsonObjects).slice((curentPage * numberRecord) - numberRecord, curentPage * numberRecord);
      this.loadGeoJsonString(geoJsonObjectsDisplay);
      this.setSelectedRow(null);
    } else {
      this.refreshMap();
      this.maxPages = 0;
      this.pageNumber = 0;
      this.valuesDisplay = [];
      this.pageNumberNext = null;
      this.setSelectedRow(null);
    }
    this.changeDetectorRef.detectChanges();
    this.refreshTable();
  }
  refreshMap() {
    if (this.currentFeatures && this.currentFeatures.length > 0) {
      this.currentFeatures.forEach(feature => {
        this.map.data.remove(feature);
      })
    }
  }
  centerControl(controlDiv, map) {
    var controlUI = this.createControlUI('Zoom', { cursor: 'pointer' });
    controlDiv.appendChild(controlUI);
    this.listenClick = this.renderer.listen(controlUI, 'click', () => {
      this.zoom(map);
    })
  }

  createControlUI(text, option?: { fontSize?: string, color?: string, lineHeight?: string, cursor?: string }) {
    var controlUI = this.renderer.createElement('div');
    controlUI.style.backgroundColor = `rgba(255, 255, 255, ${DEFAULT_OPACITY})`;
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = option && option.cursor ? option.cursor : 'center';
    controlUI.style.marginTop = '5px';
    controlUI.style.marginRight = '5px';
    controlUI.style.textAlign = 'center';
    controlUI.title = text;
    var controlText = this.renderer.createElement('div');
    controlText.style.color = option && option.color ? option.color : 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = option && option.fontSize ? option.fontSize : '16px';
    controlText.style.lineHeight = option && option.lineHeight ? option.lineHeight : '16px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.style.paddingTop = '5px';
    controlText.style.paddingBottom = '5px';
    controlText.innerHTML = text;
    controlUI.appendChild(controlText);
    return controlUI;
  }
}
