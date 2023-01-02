import { Injectable } from '@angular/core';
import { BaseHttp } from './base-http.service';
import { ITenant } from '../../shared/models/tenant';
import { Observable } from 'rxjs';
import { getHttpParams } from '../../shared/models/error';
import { map } from 'rxjs/operators';
import { IClaim } from '../../shared/models/permisions';
import { IMembershipLevel } from '../../shared/models/membershipLevel';
import * as moment from 'moment';
import { HelperService } from './helper.services';

@Injectable()
export class MasterDataService {

  constructor(private http: BaseHttp, private helperService: HelperService) { }

  getMasterDataTenants(): Observable<ITenant[]> {
    return this.http.get('TenantAdmin/getTenants')
      .pipe(map((data: ITenant[]) => {
        return data.filter(e => e.name != "Unconfigured").map(e => {
          const { tenantLicenceExpires } = e;
          const licenceExpiresWarning = this.helperService.checkLicenceExpiresWarning(tenantLicenceExpires);
          return {
            ...e,
            urls: e.url.split(', ').map(e => e ? 'https://' + e : ''),
            licenceExpiresWarning
          } as ITenant
        })
      }))
  }

  getAllAvailableLayerClaim(): Observable<IClaim[]> {
    return this.http.get('DataPackageAdmin/GetAllAvailableLayerDataActionClaims', {
    }).pipe(map(data => {
      return Object.keys(data).map(e => {
        if (e == '$type') {
          return null
        }
        return {
          id: data[e],
          name: e
        } as IClaim
      }).filter(e => e)
    }));
  }

  getMemberShipLevels(clientId: string): Observable<IMembershipLevel[]> {
    return this.http.get(`User/getMembershipLevels`, {
      params: getHttpParams({ clientId })
    }).pipe(map((data: string[]) => {
      return data.map(e => {
        return {
          id: e,
          name: e
        } as IMembershipLevel
      })
    }))
  }
  getPermissionTemplates(tenantId: string) {
    return this.http.get('DataPackageAdmin/GetAllClaimsTemplate', {
      params: getHttpParams({
        clientId: tenantId
      })
    }).pipe(map((e: any[]) => {
      return e.map(_e => ({
        ..._e,
        dataPackages: _e.dataPackages.map(_package => ({
          dataPackageId: _package.DataPackageId,
          dataPackageName: _package.DataPackageName,
          availableClaims: _package.AvailableClaims,
          programaticName: _package.ProgramaticName
        }))
      }))
    }))
  }
}
