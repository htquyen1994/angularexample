import { Injectable } from '@angular/core';
import { HttpService } from '../../../shared'
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IOutreachServices } from '../models/detail-panel.model';
@Injectable()
export class DetailPanelOutreachServicesService {

  constructor(private httpService: HttpService) { }

  getOutReachServices(id: string): Observable<IOutreachServices> {
    const params = new HttpParams()
      .set('id', id)
    return this.httpService.get('OutreachServices/GetOutreachServices', params).pipe(
      map(e=>({...e} as IOutreachServices)),
      );
  }
  getReport(id: any): Observable<any> {
    let params = new HttpParams();
    params = params.append('id', id);
    return this.httpService.downloadFileBlob('OutreachServices/GetOutreachOutreachOpeningTimessDownload', params)
  }
}
