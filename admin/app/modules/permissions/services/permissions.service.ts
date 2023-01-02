import { Injectable } from '@angular/core';
import { BaseHttp } from '../../../core/services/base-http.service';
import { getHttpParams, createSimpleError } from '../../../shared/models/error';
import { map } from 'rxjs/operators';
import { convertToILayer, ILayerGroup, ILayer } from '../../../shared/models/layer';
import { forkJoin, throwError, combineLatest } from 'rxjs';
import { uniq } from 'lodash'

@Injectable()
export class PermissionsService {

  constructor(private http: BaseHttp) { }

  getUserBaseOnTenant(tenantId) {
    return this.http.get('User/getUserList', {
      params: getHttpParams({
        clientId: tenantId,
        term: '',
        page: 0,
        limit: 999
      })
    })
    .pipe(map(data => {
          return {
            tenantId: tenantId,
            users: (data || []).filter(e => !e.enabled)
          }
        }));
  }
  getLayersBaseOnTenant(tenantId, userName) {
    if (!tenantId || !userName) {
      return throwError(createSimpleError(`Please select ${!tenantId ? 'Tenant' : 'User'}`))
    }
    return forkJoin(
      this.getLayerGroups(tenantId),
      this.http.get('DataPackageAdmin/GetDatapackageClaimList', {
        params: getHttpParams({
          clientId: tenantId,
          userName: userName
        })
      })
    ).pipe(map(([groups, data]) => {
      return {
        tenantId: tenantId,
        data: data,
        groups: groups as ILayerGroup[]
      }
    }));
  }

  updatePermission(model) {
    return this.http.post('DataPackageAdmin/UpdateAllLayerClaims', {
      ...model
    })
  }

  getLayerGroups(tenantId: string) {
    return combineLatest([
      this.http.get('AdminReferenceDataSettings', {
        params: getHttpParams({
          clientId: tenantId,
          settingCollection: 'groups',
          settingName: 'groups'
        })
      }).pipe(map(e=> e['groups'])),
      this.http.get('AdminTenantSettings', {
        params: getHttpParams({
          clientId: tenantId,
          settingCollection: 'groups',
          settingName: 'groups'
        })
      }).pipe(map(e=> e['groups']))
    ]).pipe(map(([_refGroups, _tenantGroups])=>{
      const tenantGroups = (_tenantGroups || []);
      const refGroups = (_refGroups || []);
      const mergedGroups = [...tenantGroups];
      refGroups.forEach(refGroup=>{
        const index = mergedGroups.findIndex(group=>group.name === refGroup.name);
        if(index != -1){
          mergedGroups[index].layerIds =  uniq([...mergedGroups[index].layerIds, ...refGroup.layerIds])
        }else{
          mergedGroups.push(refGroup)
        }
      })
      return mergedGroups;
    }))
  }

  savePermissionTemplate(model: { tenantId: string, name: string, layers: any[] }) {
    return this.http.post('DataPackageAdmin/CreateAllClaimsTemplate', {
      ...model
    })
  }

  updatePermissionTemplate(model: { tenantId: string, name: string, layers: any[], templateId: string }) {
    return this.http.post('DataPackageAdmin/UpdateAllClaimsTemplate', {
      ...model
    })
  }

  deletePermissionTemplate(tenantId: string, templateId: string) {
    return this.http.get('DataPackageAdmin/DeleteClaimsTemplate', {
      params: getHttpParams({
        clientId: tenantId,
        templateId
      })
    })
  }

  getAdministrativeClaims(tenantId: string, userName: string) {
    return this.http.get('DataPackageAdmin/getAdminClaimList', {
      params: getHttpParams({
        clientId: tenantId,
        userName
      })
    })
  }
  updateAdministrativeClaims(tenantId: string, userName: string, adminClaims: any) {
    return this.http.post(`DataPackageAdmin/setAdminClaimList?clientId=${tenantId}&userName=${userName}`, {
      ...adminClaims
    })
  }

  getUsersOfTemplate(tenantId: string, templateId: string){
    return this.http.get(`DataPackageAdmin/GetUsersOfTemplate?clientId=${tenantId}&templateId=${templateId}`)
  }

  updateTemplateUser(tenantId: string, dataTemplate: string,userName: string, layers: any[]){
    const model = {
      tenantId,
      userName,
      layers,
      dataTemplate,
    }
    return this.http.post(`DataPackageAdmin/UpdateAllLayerClaims`, {
      ...model
    })
  }
}
