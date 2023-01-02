import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { OverlayShapeType, OverlayShapeChangeType, ILayerColumnType, CursorType } from 'src/client/app/shared/enums';
import { OverlayShapeCircle, DrawingOverlay, OverlayService, COLORS, MapService, OverlayShape, ActionMessageService, AppInsightsService, Projection, SelectionService, OverlayShapePoint } from 'src/client/app/shared';
import { OverlayShapeOptions, ILayer } from 'src/client/app/shared/interfaces';
import { DetailPanelService } from '../../../shared/services/detail-panel.service';
import { decorateError } from 'src/client/app/shared/http.util';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'ps-report-location-form',
  templateUrl: './report-location-form.component.html',
  styleUrls: ['./report-location-form.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportLocationFormComponent implements OnInit {
  @Input() shape: { type, coordinates };
  @Input('loadingObservable') submitting$: Observable<boolean>;
  @Input() warningText: string;
  @Input() shapeOpts: OverlayShapeOptions;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();
  formGroup: FormGroup;
  shapeRef: OverlayShape;
  public clickSubscription: Subscription;
  // _shape: any;
  // submitting$ = new BehaviorSubject<boolean>(false);
  private overlay: DrawingOverlay;

  constructor(
    private overlayService: OverlayService,
    private mapService: MapService,
    private cd: ChangeDetectorRef,
    private applicationInsightsService: AppInsightsService,
    private selectionService: SelectionService,
  ) {
    this.formGroup = new FormGroup({
      lat: new FormControl('', [Validators.required]),
      lng: new FormControl('', [Validators.required])
    })
  }

  ngOnInit(): void {
    this.overlay = <DrawingOverlay>this.overlayService.overlays.get('__DATA');
    if(this.shape){
      this.createReportShape(this.shape);
    }else {
      this.listenMapClickEvent();
    }

    this.applicationInsightsService.logEvent('Details Panel', 'Report incorrect branch', '');
  }

  ngOnDestroy(): void {
    this.removeReportShape();
    this.unbindListener();
  }

  listenMapClickEvent() {
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
    }
    this.mapService.setMapCursor(CursorType.CROSSHAIR)
    this.clickSubscription = this.selectionService.mapClick$.subscribe(event => {
      const { latLng } = event;
      this.createReportShape({type: OverlayShapeType.Point, coordinates: [latLng.lng(), latLng.lat()]})
      this.cd.detectChanges();
      this.unbindListener();
    });
  }

  unbindListener() {
    if (this.clickSubscription) {
      this.mapService.setMapCursor(CursorType.DEFAULT)
      this.clickSubscription.unsubscribe();
      this.clickSubscription = null;
    }
  }

  removeReportShape() {
    if (this.shapeRef) {
      this.overlay.deleteShape(this.shapeRef.id);
      this.shapeRef = null;
    }
  }

  createReportShape(value: { type: OverlayShapeType, coordinates: any }) {
    const type = value.type;
    if (type != OverlayShapeType.Point) {
      throw "Not Implemented"
    }
    this.removeReportShape();
    const coordinates = value.coordinates;
    const opts: OverlayShapeOptions = OverlayShape.getEditShapeOptions(type, { iconSize: 24, geometry: coordinates,  icon: 'plus', ...this.shapeOpts });

    this.shapeRef = this.overlay.addShapeByCoordinates(null, type, coordinates, opts);
    this.shapeRef.change.subscribe(change => {
      if (change === OverlayShapeChangeType.DRAGEND) {
        this.locateShape();
      }
    });
    this.locateShape();
    this.mapService.zoomBounds(this.shapeRef.getBounds());
  }

  onClose() {
    this.close.next();
  }

  onSave() {
    this.submit.next({locationCoordinates: this.shapeRef.serializeGeometry()});
  }

  locateShape() {
    if (!this.shapeRef) return;
    const center = this.shapeRef.getCenter();
    this.formGroup.patchValue({
      lat: center.lat(),
      lng: center.lng()
    })
    this.formGroup.updateValueAndValidity();
  }

  onLocate() {
    const { lat, lng } = this.formGroup.getRawValue();
    const coordinates = [lng, lat];
    const type = OverlayShapeType.Point;
    this.createReportShape({ type, coordinates });
  }
}
