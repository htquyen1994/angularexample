import { Injectable } from '@angular/core';
import { HttpService } from 'src/client/app/shared';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CustomerSessionsAveragesService {

  constructor(private httpService: HttpService) { }

  getCustomerSessionsAverages(fadCode: string): Observable<any[]> {
    return this.httpService.get(`CustomerSessions/GetCustomerSessionsAverages?fadCode=${fadCode}`);
  }
 }
