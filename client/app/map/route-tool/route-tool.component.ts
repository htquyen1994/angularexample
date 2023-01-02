import { Component, OnInit, NgZone, ViewChild, ChangeDetectionStrategy, ViewEncapsulation, Inject, ChangeDetectorRef } from '@angular/core';
import { AccountService, MapService, ICONS_PATH, ICONS, OverlayShapePoint, geoCoderResultToString, ActionMessageService, SelectionService } from '../../shared';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, Subscription, of } from 'rxjs';
import { decorateError } from '../../shared/http.util';
import { DirectionsService } from '../../shared/services/directions.service';
import { UnitTypeId } from '../../shared/meassure-tool/UnitTypeId';
import { takeUntil, first, switchMap, tap, mergeMap, map } from 'rxjs/operators';
import { IAccount } from '../../shared/interfaces';
import { FormArray, FormControl, Validators, FormGroup, FormBuilder, AbstractControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { DialogComponent } from '@client/app/shared/components';
import { CursorType } from '@client/app/shared/enums';

@Component({
  selector: 'ps-route-tool',
  templateUrl: './route-tool.component.html',
  styleUrls: ['./route-tool.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DirectionsService]
})
export class RouteToolComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialog: DialogComponent;

  private unsubscribe$: Subject<void> = new Subject<void>();
  private markers: google.maps.Marker[] = [];

  public isMetric: any;
  public loading$ = new BehaviorSubject<boolean>(false);
  public UnitTypeId = UnitTypeId;
  public selectedTravelMode$: Observable<google.maps.TravelMode>;
  public reverseDirection$: Observable<boolean>;
  public selectedRouteData$: Observable<any>;
  public directionsForm: FormGroup;
  public clickSubscription: Subscription;
  public innitPosition: { x: number, y: number };
  public labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  public showReverseButton: boolean = false;
  get locations() {
    return this.directionsForm.get('locations') as FormArray;
  }
  focusingTextBox = 0;
  constructor(
    // private ngZone: NgZone,
    // private dialogRef: MatDialogRef<RouteToolComponent>,
    // @Inject(MAT_DIALOG_DATA) public data: any,
    private directionsService: DirectionsService,
    private accountService: AccountService,
    private cd: ChangeDetectorRef,
    private mapService: MapService,
    private selectionService: SelectionService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private actionMessageService: ActionMessageService,
  ) {
    this.innitPosition = {
      x: window.innerWidth - 475,
      y: 52
    }
    this.selectedTravelMode$ = this.directionsService.selectedTravelMode$;
    this.reverseDirection$ = this.directionsService.reverseDirection$;
    this.selectedRouteData$ = this.directionsService.selectedRoute$;
  }

  ngOnInit(): void {
    try {
      this.initForm();
      this.accountService.account.pipe(takeUntil(this.unsubscribe$)).subscribe((item: IAccount) => {
        if (this.isMetric != item.isMetric) {
          this.isMetric = item.isMetric;
          this.cd.detectChanges();
        }
      });
    } catch (error) {
      // this.onDialogClose(decorateError(error));
    }
  }

  // ngAfterContentInit() {
  //   this.dialog.onHide(false);
  // }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.hideRoutePath();
    this.clearAllMarker();
    this.unbindListener();
  }

  initForm() {
    this.directionsForm = this.fb.group({
      locations: this.fb.array([
        this.fb.group({
          location: this.fb.control(null),
          text: this.fb.control({ value: null, disabled: true }, Validators.required),
        }),
        this.fb.group({
          location: this.fb.control(null),
          text: this.fb.control({ value: null, disabled: true }, Validators.required),
        })
      ])
    })
    this.setFocusTextBox();
    this.listenMapClickEvent();
  }

  updateLocation(index: number, latLng: google.maps.LatLng, isRenderMarker = true) {
    this.mapService.geocoding(latLng).subscribe(results => {
      this.locations.controls[index].setValue({
        location: latLng,
        text: geoCoderResultToString(results[0])
      })
      this.renderRoute(isRenderMarker);
    })
  }

  listenMapClickEvent() {
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
    }
    this.mapService.setMapCursor(CursorType.CROSSHAIR)
    this.clickSubscription = this.selectionService.mapClick$.subscribe(event => {
      const { latLng } = event;
      const index = this.focusingTextBox;
      if (index == -1) return of(null);
      this.locations.controls[index].setValue({
        location: latLng,
        text: ''
      })
      this.setFocusTextBox();
      this.updateLocation(index, latLng, true);
      // this.renderRoute(true);
      this.cd.detectChanges();
    });
  }

  unbindListener() {
    if (this.clickSubscription) {
      this.mapService.setMapCursor(CursorType.DEFAULT)
      this.clickSubscription.unsubscribe();
      this.clickSubscription = null;
    }
  }

  setFocusTextBox() {
    const locations = this.locations.getRawValue();
    const index = locations.findIndex(e => !e.location);
    this.focusingTextBox = index;
    this.cd.detectChanges();
  }

  renderRoute(isRenderMarker?: boolean) {
    const locations = this.locations.getRawValue();
    if (isRenderMarker) {
      locations.forEach((e, i) => {
        if (!this.markers[i]) {
          this.addMarker(e.location, i);
        } else {
          this.markers[i].setPosition(e.location);
        }
      })
    }
    const directions = locations.map(e => e.location).filter(e => !!e);
    if (directions.length > 1) {
      this.loading$.next(true);
      this.directionsService.calcRouteForArray(directions, { visible: false, position: null }).subscribe(result => {
        this.unbindListener();
        this.loading$.next(false);
        this.cd.detectChanges();
      }, e => {
        this.actionMessageService.sendError(decorateError(e).error.message);
        this.loading$.next(false);
        this.cd.detectChanges();
      })
    }
  }

  hideRoutePath() {
    this.directionsService.reset();
    this.directionsService.clearRoute();
    this.directionsService.onSelectedRoute(null);
  }

  // onDialogClose(result?: any) {
  //   this.ngZone.run(() => {
  //     this.dialogRef.close(result);
  //   })
  // }

  onSelectedTravelMode(mode: google.maps.TravelMode) {
    if (mode === this.directionsService.selectedTravelMode.getValue()) return;
    this.directionsService.selectedTravelMode.next(mode);
    this.renderRoute(false);
  }

  onReverseDirection() {
    const locations = this.locations.getRawValue().reverse();
    this.locations.setValue(locations);
    const currentValue = this.directionsService.reverseDirection.getValue();
    this.directionsService.reverseDirection.next(!currentValue);
    // this.markers.reverse().forEach((e,i)=>e.setLabel({ text: this.labels[i % this.labels.length], color: '#fff' }))
    this.setFocusTextBox();
    this.renderRoute(true);
  }

  drop($event) {
    console.log(event)
  }

  getOptionsMarker(position?, fillColor = "#333333", scale = 1) {
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
      anchor: new google.maps.Point(24 * _icon.scale / 2, 24 * _icon.scale)
    };

    return {
      position,
      icon,
      draggable: true
    } as google.maps.MarkerOptions
  }

  addMarker(position: google.maps.LatLng, index: number) {
    const marker: google.maps.Marker = new google.maps.Marker({ label: { text: this.labels[index % this.labels.length], color: '#fff' }, position, draggable: true });
    marker.setMap(this.mapService.map);
    marker.addListener('dragend', () => {
      const latLng = marker.getPosition();
      this.updateLocation(index, latLng, false);
    })
    this.markers.push(marker);
  }
  clearAllMarker() {
    this.markers.forEach(e => e.setMap(null));
    this.markers = [];
  }
  removeMarker(index) {
    if (this.markers[index]) {
      this.markers[index].setMap(null);
      this.markers.splice(index, 1);
    }
  }
}
