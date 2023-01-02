import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MasterSelector } from '../../store/selectors'
import { Store } from '@ngrx/store';
import { ITenant } from '@admin-shared/models/tenant';
import { MasterDataAction } from '../../store/actions';
@Injectable({
  providedIn: 'root'
})
export class MasterDataStoreService {

  constructor(
    private _store: Store
  ) { }

  public readonly tenants$ = this._store.select(MasterSelector.selectTenants);
  public readonly claims$ = this._store.select(MasterSelector.selectClaims);

  public getTemplates(tenantId) {
    return this._store.select(MasterSelector.selectTemplates, { tenantId });
  }
  public loadPermissionTemplates(tenantId){
    this._store.dispatch(MasterDataAction.loadPermissionTemplates({ payload: { tenantId } }))
  }
}
