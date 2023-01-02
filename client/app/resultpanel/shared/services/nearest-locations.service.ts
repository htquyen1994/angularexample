import { Injectable } from '@angular/core';
import { HttpService } from 'src/client/app/shared';
import { IOutreachServices } from '../models/detail-panel.model';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { map, filter, first, tap } from 'rxjs/operators';

@Injectable()
export class NearestLocationsService {
  nearestLocationsFilterOptions$ = new BehaviorSubject<string[]>(null)

  constructor(private httpService: HttpService) { }

  getNearestLocationsFilterOptions(): Observable<string[]> {
    if (!this.nearestLocationsFilterOptions$.value) {
      return this.httpService.get('Branch/GetNearestLocationsFilterOptions').pipe(
        tap(data => this.nearestLocationsFilterOptions$.next(data))
      );
    }
    return this.nearestLocationsFilterOptions$.pipe(filter(e => !!e), first())
  }

  getNearestLocations(fadCode: string, filter: string): Observable<{ name: string, location: string, type: string, outreachLat: number, outreachLng: number, distanceMetres: number }[]> {
    const params = new HttpParams()
      .set('fadCode', fadCode)
      .set('filter', filter)
    return this.httpService.get('Branch/GetNearestLocations', params).pipe(
      map((data: any) => data.map((e, i) => ({
        fadCode: i,
        name: e.name,
        location: e.address,
        type: e.type,
        distanceMetres: 0,
        outreachLat: e.lat,
        outreachLng: e.lng,
      })))
    );
  }

  getReport(filter: string, nearestLocations: any[]): Observable<any> {
    const nearestLocation = {
      filter,
      nearestLocations
    }
    return this.httpService.downloadFileBlob_post('Branch/GetNearestLocationsDownload', nearestLocation)
  }

}
