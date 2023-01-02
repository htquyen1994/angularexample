import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ChangeDetectorRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IOutreachServices } from '../../../shared/models/detail-panel.model';
import { NearestLocationsService } from '../../../shared/services/nearest-locations.service';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { ActionMessageService, MapService, AppInsightsService } from 'src/client/app/shared';
import { decorateError } from 'src/client/app/shared/http.util';
import { DirectionsService } from 'src/client/app/shared/services/directions.service';
import { GoTableColumn } from '@periscope-lib/table/table.model';
import { da } from 'date-fns/locale';
import { OutreachServicesComponent } from '../outreach-services/outreach-services.component';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'ps-nearest-locations',
  templateUrl: './nearest-locations.component.html',
  styleUrls: ['./nearest-locations.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NearestLocationsComponent implements OnInit {
  @ViewChild('outreachService') outreachService: OutreachServicesComponent
  @Input('fadCode') set _fadCode(value: string){
    if (this.selectedFilter && this.fadCode != value) {
      this.fadCode = value;
      this.onSelectedFilter(this.selectedFilter);
    } else {
      this.fadCode = value;
    }
  };
  fadCode: string;
  @Input() centroid: { lng: number, lat: number };
  @Output() filter = new EventEmitter<string>();
  @Output() downloading = new EventEmitter<boolean>();
  public headers: GoTableColumn[] = [
    { name: 'Name', trackBy: 'name', class: 'w-30' },
    { name: 'Type', trackBy: 'type', class: 'w-20' },
    { name: 'Address', trackBy: 'location', class: 'w-50' },
    { name: 'Driving Distance', trackBy: '_distanceMetres', class: 'w-20' },
    { name: '', trackBy: '', class: 'action-column' },
  ];
  outreachServicesData$ = new BehaviorSubject<IOutreachServices>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  options$: Observable<PsSelectOption[]>
  selectedFilter: string;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private nearestLocationsService: NearestLocationsService,
    private actionMessageService: ActionMessageService,
    private mapService: MapService,
    private cd: ChangeDetectorRef,
    private applicationInsightsService: AppInsightsService
  ) {
    this.options$ = nearestLocationsService.getNearestLocationsFilterOptions().pipe(map(data=>data.map(e=>({value: e, label: e}))));
  }

  ngOnInit(): void {
    this.applicationInsightsService.logEvent('Details Panel', 'Nearest Locations', '');
  }

  onSelectedFilter(filter: string) {
    this.filter.next(filter);
    this.getNearestLocations(this.fadCode, filter, this.centroid.lat, this.centroid.lng);
  }

  getNearestLocations(fadCode: string, filter: string, coreLat: number, coreLng: number) {
    this.loading$.next(true);
    this.downloading.next(true);
    this.cd.detectChanges();
    this.outreachService.reset();
    this.nearestLocationsService.getNearestLocations(fadCode, filter).pipe(
      switchMap((data) => {
        const origins = [new google.maps.LatLng(coreLat, coreLng)];
        const destinations = data.map(e => new google.maps.LatLng(e.outreachLat, e.outreachLng))
        return this.mapService.getDistanceMatrix({ origins, destinations }).pipe(
          map(distanceMatrix => {
            return data.map((e, i) => ({ ...e, distanceMetres: distanceMatrix[i].distance })).sort((a,b)=>  a.distanceMetres - b.distanceMetres);
          })
        )
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe(data => {
      this.loading$.next(false);
      this.downloading.next(false);
      this.outreachServicesData$.next({ outreaches: data.slice(0,5), fadCode, coreLat, coreLng, coreBranch: '', outreachCluster: '' });
      this.cd.detectChanges();
    }, err => {
      this.loading$.next(false);
      this.downloading.next(false);
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.cd.detectChanges();
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onDownload() {
    const value = this.outreachService.getOutreachData();
    const nearestLocations = value.outreaches.map(e => ({
      name: e.name,
      type: e.type,
      address: e.location,
      distance: e._distanceMetres,
      lat: e.outreachLat,
      lng: e.outreachLng
    }))
    this.downloading.next(true);
    this.nearestLocationsService.getReport(this.selectedFilter, nearestLocations).subscribe(e => {
      this.downloading.next(false);
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.downloading.next(false);
    });
  }
}
