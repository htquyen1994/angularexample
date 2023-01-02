import { Injectable } from '@angular/core';
import { BaseHttp } from '../../../core/services/base-http.service';
import { getHttpParams } from '../../../shared/models/error';
import { ICacheDelete } from '../models';

@Injectable()
export class ReferenceDataService {

  constructor(private http: BaseHttp) { }

  getReferenceDataPackages() {
    return this.http.get('DataPackageAdmin/GetReferenceDataPackages');
  }

  getDataReport() {
    return this.http.downloadFile(`DataPackageAdmin/DownloadReferenceDataPackages`);
  }
  getDefaultBuildReport() {
    return this.http.downloadFile(`DataPackageAdmin/DownloadDefaultBuildPackages`);
  }
  deleteDataPackageCache(model: ICacheDelete) {
    return this.http.post('CacheAdmin/Delete', {
      ...model
    })
  }

  getReferencedInsightViews(dataPackageId: string) {
    // return of({
    //   referencedInsightViews:{
    //     "b4782d2e-e84f-41a7-8783-114ef040c668":{
    //       "userInsightViews":{
    //         "morrisons@newgrove.com":["DM Morrisons stores","DM Morrisons stores","DM Morrisons stores"],
    //         "morrisons1@newgrove.com":["DM Morrisons stores","DM Morrisons stores","DM Morrisons stores"]
    //       },
    //       "tenantInsightViews":["DM Morrisons stores","DM Morrisons stores","DM Morrisons stores"]
    //     }}
    // })
    return this.http.get('DataPackageAdmin/GetReferencedInsightViews', {
      params: getHttpParams({
        dataPackageId: dataPackageId
      })
    });
  }
}
