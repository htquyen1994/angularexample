import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, NgZone } from '@angular/core';
import { Observable, Observer, BehaviorSubject } from 'rxjs';
import { ILocation } from '@client/app/shared/interfaces';

import { MapService, LocationService, geoCoderResultToString } from 'src/client/app/shared';
import { map, tap, mergeMap } from 'rxjs/operators';
import { ModalService } from '@client/app/shared/services';
import { CommonDialogIds } from '@client/app/core/enums';

@Component({
  selector: 'ps-location-form-container',
  templateUrl: './location-form-container.component.html',
  styleUrls: ['./location-form-container.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LocationFormContainerComponent implements OnInit {
  geoCoder = new google.maps.Geocoder();
  location$: Observable<ILocation>
  public loading$ = new BehaviorSubject<boolean>(false);
  private setTimeout:any;
  constructor(
    private mapService: MapService,
    private locationService: LocationService,
    private cd: ChangeDetectorRef,
    private _modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.location$ = this.mapService.location.pipe(
      mergeMap(() => {
        this.emitLoading(true);
        clearTimeout(this.setTimeout);
        const zoom = this.mapService.map.getZoom();
        const point = this.mapService.getVisibleViewportCenter();

        const location = {
          coordinates: { lat: point.lat, lng: point.lng },
          isDefault: false,
          locationType: 'Point',
          name: '',
          zoom: zoom
        };
        return this.getGeoCode(location.coordinates).pipe(
          map(name => {
            return {
              ...location,
              name
            }
          }),
          tap(() => this.setTimeout = setTimeout(() => {
            this.emitLoading(false);
          }, 300)))
      }))
  }

  addLocation(location: ILocation) {
    this.emitLoading(true);
    this.locationService.addLocationObs(location, location.zoom).subscribe(()=>{
      this.emitLoading(false);
      this._modalService.closeModalById(CommonDialogIds.LocationFormContainerComponent)
    }, ()=>{
      this.emitLoading(false);
    });
  }

  getGeoCode(location: any): Observable<string> {
    return Observable.create((observer: Observer<string>) => {
      this.geoCoder.geocode({ location }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          observer.next(geoCoderResultToString(results[0]));
          observer.complete();
          return;
        }
        observer.next('');
        observer.complete();
      });
    })
  }

  emitLoading(value: boolean) {
    this.loading$.next(value);
    this.cd.detectChanges();
  }
}
