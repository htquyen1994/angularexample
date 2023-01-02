import { Injectable } from '@angular/core';
import { HttpService } from 'src/client/app/shared';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CustomerSessionPerformanceService {

  constructor(private httpService: HttpService) { }

  getCustomerSessionsPerformance(fadCode: string): Observable<any[]> {
    return this.httpService.get(`CustomerSessions/GetCustomerSessionPerformance?fadCode=${fadCode}`);
  }
 }
