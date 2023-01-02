import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Tenant, GazetteerSettings, StartSettings, FunctionalitySettings } from './tenant.interface';
import { Observable, ReplaySubject } from 'rxjs';
import { ListResponse, getHttpParams } from '../../shared/models/error';
import { BaseHttp } from '../../core/services/base-http.service';
import { HelperService } from '@admin-core/services';

export type TenantsResponse = ListResponse<Tenant>;

@Injectable()
export class TenantService {
    tenantList$ = new ReplaySubject<TenantsResponse>();

    constructor(private http: BaseHttp, private helperService: HelperService) {
    }

    getTenantList(term: string = '', page: number = 0, limit: number = 999): Observable<TenantsResponse> {
        return this.http.get('TenantAdmin/getTenantList', {
            params: getHttpParams({ term, page, limit })
        }).pipe(
            map((data: any[]) => {
                return {
                    length: data.length,
                    data: data
                };
            }),
        );
    }

    createTenant(tenant: Tenant): Observable<Tenant> {
        return this.http.getJsonWithType<Tenant>('/client.json', {
            params: getHttpParams(tenant)
        });
    }

    readTenant(tenantId: string): Observable<Tenant> {
        return this.http.getWithType<Tenant>('TenantAdmin/readTenant', {
            params: getHttpParams({ tenantId })
        });
    }

    updateTenant(tenant: Tenant): Observable<Tenant> {
        return this.http.post('TenantAdmin/updateTenant', tenant).pipe(map(data=>({...data, licenceExpiresWarning : this.helperService.checkLicenceExpiresWarning(data.tenantLicenceExpires)})))
    }

    deleteTenant(tenantId: string): Observable<Tenant> {
        return this.http.getWithType<Tenant>('TenantAdmin/deleteTenant', {
            params: getHttpParams({ tenantId })
        });
    }

    setGazetteerSettings(settings: GazetteerSettings) {

        // TR to implement

        //	this.httpService.get('TenantSettingsAdmin/?settingCollection=uigazetteersettings&settingName=uigazetteersettings').subscribe(filters => {

        //		filter.source = LayerSource.CORPORATE;
        //		if (!filters[layerId]) {
        //			filters[layerId] = [];
        //		}
        //		filters[layerId].push(filter);
        //		this.httpService.postJSON('TenantSettings/?settingCollection=filters&settingName=filters', filters)
        //			.subscribe(() => {
        //				this.actionMessageService.sendInfo('copy filter to tenant');
        //			});
        //	});
    }

    setStartSettings(settings: StartSettings) {
        // TR to implement
    }

    setFunctionalitySettings(settings: FunctionalitySettings) {
        // TR to implement
    }

}
