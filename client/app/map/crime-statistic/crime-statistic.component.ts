import { Component, OnInit, NgZone, Inject, ChangeDetectionStrategy, ViewEncapsulation, ViewChild, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SelectionService, MapService, OverlayShape, DrawingOverlay, ActionMessageService, OverlayService } from '../../shared';
import { GoTableColumn } from '@periscope-lib/table/table.model';
import { OverlayShapeType, OverlayShapeChangeType, CursorType } from '../../shared/enums';
import { OverlayShapeOptions } from '../../shared/interfaces';
import { decorateError } from '../../shared/http.util';
import { DetailPanelService } from '../../resultpanel/shared/services/detail-panel.service';

import { DialogComponent } from '@client/app/shared/components';

@Component({
  selector: 'ps-crime-statistic',
  templateUrl: './crime-statistic.component.html',
  styleUrls: ['./crime-statistic.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CrimeStatisticComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialog: DialogComponent;

  @Output() listeningMapClick = new EventEmitter<boolean>();

  crimeStatisticsHeaders: GoTableColumn[] = [
    { name: 'Crime Statistics', trackBy: 'description', class: 'w-40' },
    { name: '1 mi', trackBy: 'count1Mile',  class: 'w-15' },
    { name: '3 mi', trackBy: 'count3Mile', class: 'w-15' },
    { name: '5 mi', trackBy: 'count5Mile',  class: 'w-15'},
    { name: '10 mi', trackBy: 'count10Mile', class: 'w-15' }
  ];
  data$ = new BehaviorSubject<any>([]);
  shapeRef: OverlayShape;
  private overlay: DrawingOverlay;
  public innitPosition: { x: number, y: number };
  public loading$ = new BehaviorSubject<boolean>(false);
  public clickSubscription: Subscription;
  public location: {lat: number, lng: number};
  constructor(
    private ngZone: NgZone,
    private dialogRef: MatDialogRef<CrimeStatisticComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private selectionService: SelectionService,
    private mapService: MapService,
    private cd: ChangeDetectorRef,
    private actionMessageService: ActionMessageService,
    private detailPanelService: DetailPanelService,
    private overlayService: OverlayService,
  ) {
    this.overlay = <DrawingOverlay>this.overlayService.overlays.get('__DATA');
    this.innitPosition = {
      x: window.innerWidth - 575,
      y: 52
    }
  }

  ngOnInit(): void {
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
    this.listenMapClickEvent();
  }

  ngOnDestroy(): void {
    this.removeShape();
    this.unbindListener();
  }

  onDialogClose(result?: any) {
    this.ngZone.run(() => {
      this.dialogRef.close(result);
    })
  }

  listenMapClickEvent() {
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
    }
    this.listeningMapClick.next(true);
    this.mapService.setMapCursor(CursorType.CROSSHAIR)
    this.removeShape();
    this.cd.detectChanges();
    this.clickSubscription = this.selectionService.mapClick$.subscribe(event => {
      const { latLng } = event;
      this.createShape({type: OverlayShapeType.Point, coordinates: [latLng.lng(), latLng.lat()]})
      this.unbindListener();
      this.cd.detectChanges();
    });
  }

  unbindListener() {
    this.listeningMapClick.next(false);
    if (this.clickSubscription) {
      this.mapService.setMapCursor(CursorType.DEFAULT)
      this.clickSubscription.unsubscribe();
      this.clickSubscription = null;
    }
  }

  createShape(value: { type: OverlayShapeType, coordinates: any }) {
    const type = value.type;
    if (type != OverlayShapeType.Point) {
      throw "Not Implemented"
    }
    // this.removeShape();
    const coordinates = value.coordinates;
    const opts: OverlayShapeOptions = OverlayShape.getEditShapeOptions(type, { iconSize: 24, geometry: coordinates,  icon: 'plus' });

    this.shapeRef = this.overlay.addShapeByCoordinates(null, type, coordinates, opts);
    this.shapeRef.change.subscribe(change => {
      const center = this.shapeRef.getCenter();
      if (change === OverlayShapeChangeType.DRAGEND) {
        this.getStatistic([center.lng(), center.lat()]);
      }
    });
    this.getStatistic(coordinates);
    this.mapService.zoomBounds(this.shapeRef.getBounds());
  }

  removeShape() {
    if (this.shapeRef) {
      this.overlay.deleteShape(this.shapeRef.id);
      this.shapeRef = null;
    }
  }

  getStatistic(coordinates: any) {
    this.location = { lat: coordinates[1], lng: coordinates[0] };
    this.loading$.next(true);
    this.detailPanelService.getCrimeStatistic({ lat: coordinates[1], lng: coordinates[0] }).subscribe(res => {
      this.data$.next(res);
      this.loading$.next(false);
      this.cd.detectChanges();
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
      this.cd.detectChanges();
    })
  }

  onRefresh(){
    this.location = null;
    this.data$.next(null);
    this.removeShape();
    this.listenMapClickEvent();
    this.cd.detectChanges();
  }

  onLocate(){
    this.mapService.zoomBounds(this.shapeRef.getBounds());
  }
}
