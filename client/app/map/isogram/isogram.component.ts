import { Component, HostBinding, Output, EventEmitter, NgZone, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  OverlayService,
  SelectionService,
  AccountService,
  OverlayShape,
  ZINDEX,
  LayerService,
  IsogramService,
  DrawingOverlay,
  SettingsService,
  UNITS,
  MapService,
  ICONS,
  createSimpleError,
  IErrorResponse,
  CATCHMENT_SETTINGS
} from '../../shared';
import { OverlayShapeOptions, TravelModel, IStartUpSettings } from '../../shared/interfaces';
import { TravelType, CursorType } from '../../shared/enums';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TravelType as CoreTravelType} from '../../core/modules/view-management/enums';
import { NgControl, NgModel } from '@angular/forms';
@Component({
  selector: 'go-isogram',
  moduleId: module.id,
  templateUrl: 'isogram.component.html',
  styleUrls: ['isogram.component.less'],
  changeDetection:  ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class IsogramComponent {
  @Output() close = new EventEmitter<boolean>();
  @HostBinding('attr.tabindex') tabindex = 1;
  @ViewChild('valueTime') valueTime: NgModel;
  @ViewChild('valueDistance') valueDistance: NgModel;
  model: TravelModel ;

  travelType = TravelType;
  CoreTravelType = CoreTravelType;
  isMetric = true;
  hasAdvancedCatchments = false;
  hasTrafficWeightedCatchments = false;

  private shape: OverlayShape;
  private layerId: string;
  private unsubscribe$: Subject<void> = new Subject<void>();
  public error: IErrorResponse;
  public loading$ = new BehaviorSubject<boolean>(false);
  public min_duration = CATCHMENT_SETTINGS.MIN_DURATION;
  public min_distance = CATCHMENT_SETTINGS.MIN_DISTANCE;
  constructor(private isogramService: IsogramService,
    private accountService: AccountService,
    private layerService: LayerService,
    private overlayService: OverlayService,
    private selectionService: SelectionService,
    private settingsService: SettingsService,
    private cd: ChangeDetectorRef,
    private mapService: MapService,
    private _ngZone: NgZone) {
    this.model = {
      mode: 'car',
      valueTime: 10,
      valueDistance: 10,
      towardsOrigin: false,
      type: TravelType.DURATION,
      isDetail: false,
      scenario: ''
    };
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.mapService.setMapCursor(CursorType.DEFAULT)
  }


  ngOnInit() {
    this.mapService.setMapCursor(CursorType.CROSSHAIR)
    this.accountService.account.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(account => {
      this.hasAdvancedCatchments = account.hasAdvancedCatchments;
      this.hasTrafficWeightedCatchments = account.hasTrafficWeightedCatchments;
      this.isMetric = account.isMetric;
      this.cd.detectChanges();
    });

    this.selectionService.mapClick$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((event) => {
      const { type } = this.model;
      this.error = null;
      if(type === TravelType.DISTANCE && this.valueDistance.invalid){
        if(this.valueDistance.errors){
          this.error = createSimpleError(this.valueDistance.errors.errorMessage)
        }else{
          this.error = createSimpleError("Something went wrong!")
        }
        this.cd.detectChanges();
        return;
      }

      if(type === TravelType.DURATION && this.valueTime.invalid){
        if(this.valueTime.errors){
          this.error = createSimpleError(this.valueTime.errors.errorMessage)
        }else{
          this.error = createSimpleError("Something went wrong!")
        }
        this.cd.detectChanges();
        return;
      }

      this.selectionService.isogramSource.next(event.latLng);
      this.mapService.addMarker(event.latLng, ICONS.LOCATION, {isEditable: false, isSelectable: false});
    })

    this.isogramService.travel.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((polygon: any) => {
      if (polygon.error) {
        this.emitLoading(false);
        return;
      }
      const overlay = <DrawingOverlay>this.overlayService.overlays.get('__DRAW');
      if (!this.shape) {
        const opts: OverlayShapeOptions = {
          zIndex: ZINDEX.SELECTION,
          isSelectable: true
        };
        this.shape = overlay.addShapeByCoordinates(null, polygon.type, polygon.coordinates, opts);

        this.selectionService.changeSelection({
          isAdd: true,
          overlayId: overlay.id,
          shapeId: this.shape.id
        });
      }
      this.emitLoading(false);
    });

    this.selectionService.isogram.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((point: any) => {
      this.emitLoading(true);
      if (this.shape) {
        // delete last isogram if exists
        // this.shape.clean();
        this.shape = null;
      }
      const value = this.model.type === TravelType.DURATION ? this.model.valueTime : this.isMetric ?   this.model.valueDistance : this.model.valueDistance * UNITS.MILE.constant / 1000
      const model = Object.assign({}, this.model, {
        value
      });
      this.isogramService.init(point, model);
    });
  }

  getCatchmentModel([type, isDetail, isMetric]){
    return this._ngZone.run(()=>{
      return {
        type : type === TravelType.DURATION ? CoreTravelType.DURATION: CoreTravelType.DISTANCE,
        isDetail,
        isMetric
      }
    })
  }

  maxDriveTime_slider(isDetail){
    return isDetail ?  CATCHMENT_SETTINGS.MAX_DURATION_HIGH : CATCHMENT_SETTINGS.MAX_DURATION_LOW;
  }

  maxDriveDistance_slider([isMetric, isDetail]){
    const maxDriveDistance = isDetail ? CATCHMENT_SETTINGS.MAX_DISTANCE_HIGH : CATCHMENT_SETTINGS.MAX_DISTANCE_LOW;
    return isMetric ? maxDriveDistance : Number.parseFloat((maxDriveDistance * 1000 / UNITS.MILE.constant).toFixed(1))
  }

  maxDriveDistanceValue([isDetail]){
    const maxDriveDistance = isDetail ? CATCHMENT_SETTINGS.MAX_DISTANCE_HIGH : CATCHMENT_SETTINGS.MAX_DISTANCE_LOW;
    return maxDriveDistance
  }

  minDriveDistance_slider([isMetric]){
    return  (isMetric ? CATCHMENT_SETTINGS.MIN_DISTANCE : (CATCHMENT_SETTINGS.MIN_DISTANCE * 1000 / UNITS.MILE.constant).toFixed(1))
  }

  onClose() {
    this.close.emit(true);
  }

  // is always minutes now.
  format(value: number): string {
    return `${Number(value).toFixed(1)}`;
  }

  setMode(mode: string) {
    this.model.mode = mode;
    if (this.model.mode === 'foot' && Number(this.model.valueDistance) > 5) {
      this.model.valueDistance = 5;
    }
  }

  emitLoading(value: boolean) {
    this.loading$.next(value);
    this.cd.detectChanges();
  }

  onToggle(key: string, value: any){
    this.model[key] = value;
    if(key == 'isDetail'){
      if(!value){
        if(this.model.towardsOrigin){
          this.model.towardsOrigin = false;
        }
      }
    }
    this.model = {...this.model};
    this.cd.detectChanges();
  }
}
