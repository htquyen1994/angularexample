import { Injectable } from '@angular/core';
import { HttpService } from '../../../shared'
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IOutreachServices } from '../models/detail-panel.model';
@Injectable()
export class DetailPanelService {

  constructor(private httpService: HttpService) { }

  reportLocation(data: { fadCode: string, branchName: any, newLocationCoordinatesBNG: any, newLocationCoordinatesLatLng }) {
    return this.httpService.postJSON(`Branch/ReportIncorrectLocation`, { ...data });
  }

  getCrimeStatistic(data: { lat: string, lng: any }) {
    const params = new HttpParams()
      .set('lat', data.lat)
      .set('lng', data.lng)
    return this.httpService.get(`Retailer/GetCrimeStatistics`, params).pipe(map(data=>data.map(e => ({ ...e, description: this.formatDescription(e.description) }))));
  }
  formatDescription(str: string) {
    const matches = str.match(/\((.*?)\)/);
    let result = str;
    if (matches) {
      result = str.replace(matches[0], ``);
      result = `${result}
      ${matches[0]}
      `
    }
    return `${result}`;
  }
}
