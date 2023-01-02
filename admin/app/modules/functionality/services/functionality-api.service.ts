import { Injectable } from '@angular/core';
import { BaseHttp } from '../../../core/services/base-http.service';
@Injectable({
  providedIn: 'root'
})
export class FunctionalityApiService {

  constructor(private http: BaseHttp) { }

  getFunctionality(tenantId: string) {
    return this.http.get(`FugAdmin/GetFunctionalityByGroup?clientId=${tenantId}`);
  }

  downloadFunctionality(tenantId: string) {
    return this.http.downloadFile(`FugAdmin/DownloadFunctionalityByGroup?clientId=${tenantId}`);
  }
}
