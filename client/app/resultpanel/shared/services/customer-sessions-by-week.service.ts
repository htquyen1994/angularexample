import { Injectable } from '@angular/core';
import { HttpService } from 'src/client/app/shared';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class CustomerSessionsByWeekService {

  constructor(private httpService: HttpService) { }

  getCustomerSessionsByWeek(fadCode: string[], mindate: string, maxdate: string): Observable<any[]> {
    const params = fadCode.map(e => new HttpParams()
      .set('fadCode', e)
      .set('mindate', mindate)
      .set('maxdate', maxdate))
    return forkJoin(
      params.map((e, i) =>
        this.httpService.get('CustomerSessions/GetCustomerSessionsByWeek', e).pipe(
          switchMap(e => of({ data: e })),
          catchError(err => of({ error: err }))
        ))).pipe(
          map((data: any[]) => {
            console.log(data);
            return (data || []).map((_data, i) => {
              const { error, data } = _data;
              return { chartData: (data || []), fadCode: fadCode[i], error }
            });
          })
        )
  }
  getCustomerSessionsByWeekSummary(fadCode: string, mindate: string, maxdate: string, selecteddate: string): Observable<any> {
    const params = new HttpParams()
      .set('fadCode', fadCode)
      .set('mindate', mindate)
      .set('maxdate', maxdate)
      .set('selecteddate',selecteddate)
    return this.httpService.get('CustomerSessions/GetCustomerSessionsByWeekSummary', params).pipe(
      map((_data: any) => {
        console.log(_data);
        return { chartData: _data, fadCode }
      })
    )
  }
  getBranches(searchTerm: string, excludedFadcodes: string, historicClosures: boolean, pageNumber: number = 0, pageSize: number = 25,): Observable<any> {
    return this.httpService.postJSON('CustomerSessions/Search', { searchTerm, historicClosures, excludedFadcodes, pageSize, pageNumber })
      .pipe(
        map((data: any[]) => {
          return data.map(e => {
            return {
              fadCode: e.FadCode,
              place: e.Place,
              distanceMetres: e.DistanceMetres,
              type: e.BranchType,
              isHistoric: e.IsHistoric
            }
          })
        })
      );
  }

  getReport(fadCodes: string[], mindate: string, maxdate: string): Observable<any> {
    let params = new HttpParams();
    params = params.append('mindate', mindate);
    params = params.append('maxdate', maxdate);
    fadCodes.forEach(e => { params = params.append('fadCodes', e) });
    return this.httpService.downloadFileBlob('CustomerSessions/GetCustomerSessionsByWeekDownload', params)
  }

}
