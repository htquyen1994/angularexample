import { Injectable } from '@angular/core';
import { HttpService } from 'src/client/app/shared';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class CustomerSessionsByDateTimeService {

  constructor(private httpService: HttpService) { }

  getCustomerSessionsByDateTime(fadCode, isCore: boolean): Observable<any[]> {
    const params = new HttpParams()
      .set('fadCode', fadCode)
      .set('isCore', isCore ? 'true' : 'false')
    return this.httpService.get('CustomerSessions/GetCustomerSessionsByDateTime', params);
  }
  getReport(fadCode: string, isCore: boolean): Observable<any> {
    const params = new HttpParams()
    .set('fadCode', fadCode)
    .set('isCore', isCore ? 'true' : 'false')
    return this.httpService.downloadFileBlob('CustomerSessions/GetCustomerSessionsByDateTimeDownload', params)
  }
}
