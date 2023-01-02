import { Injectable } from '@angular/core';
import { BaseHttp } from '@admin-core/services/base-http.service';
import { Observable } from 'rxjs';
import { API_BASE_HREF } from '@admin-shared/models/global';

@Injectable()
export class ReportsService {

  constructor(private http: BaseHttp) { }

  getReportsUser() {
    return this.http.downloadFile(`ReportsAdmin/Users`);
  }
}
