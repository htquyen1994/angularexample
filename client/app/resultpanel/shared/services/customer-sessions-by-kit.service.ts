import { Injectable } from '@angular/core';
import { HttpService } from 'src/client/app/shared';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CustomerSessionsByKitService {

  constructor(private httpService: HttpService) { }

  getCustomerSessionsByKit(fadCode: string, mindate: string, maxdate: string, onlyKits: boolean): Observable<any> {
    const params = new HttpParams()
      .set('fadCode', fadCode)
      .set('mindate', mindate)
      .set('maxdate', maxdate)
      .set('onlyKits', onlyKits ? 'true' : 'false')
    return this.httpService.get('CustomerSessions/GetCustomerSessionsByKit', params);
  }
  getCustomerSessionsByKitSummary(fadCode: string, mindate: string, maxdate: string, onlyKits: boolean, selecteddate: string): Observable<any> {
    const params = new HttpParams()
      .set('fadCode', fadCode)
      .set('mindate', mindate)
      .set('maxdate', maxdate)
      .set('onlyKits', onlyKits ? 'true' : 'false')
      .set('selecteddate', selecteddate)
    return this.httpService.get('CustomerSessions/GetCustomerSessionsByKitSummary', params)
  }
}
