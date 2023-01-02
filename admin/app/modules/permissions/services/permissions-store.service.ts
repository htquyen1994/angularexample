import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {permissionActions} from '../actions'
import { FilterForm, PermissionTemplateState, TemplateUserState } from '../interfaces';
import { permissionSelectors } from '../selectors';
import { ILayer } from '@admin-shared/models/layer';

@Injectable({
  providedIn: 'root'
})
export class PermissionsStoreService {

  constructor(
    private _store: Store
  ) { }

  public readonly usersBaseOnTenant$ = this._store.select(permissionSelectors.selectUsersBaseOnTenant);
  public readonly layersBaseOnTenant$ = this._store.select(permissionSelectors.selectLayersBaseOnTenant);
  public readonly filterForm$ = this._store.select(permissionSelectors.selectFilterForm);
  public readonly templateState$ = this._store.select(permissionSelectors.selectedTemplateState);
  public readonly templateLoading$ = this._store.select(permissionSelectors.selectedTemplateLoading);
  public readonly templateUsers$ = this._store.select(permissionSelectors.selectedTemplateUsers);

  public setFilterPermissions(payload: FilterForm){
    this._store.dispatch(permissionActions.setFilterPermissions({
      payload
    }))
  }

  public getUserBaseOnTenant(tenantId: string) {
    this._store.dispatch(permissionActions.getUserBaseOnTenant({
      payload: tenantId
    }))
  }

  public getLayersBaseOnTenant(tenantId: string, userName: string) {
    this._store.dispatch(permissionActions.getLayersBaseOnTenant({
      payload: {
        tenantId,
        userName
      }
    }))
  }

  public resetLayersBaseOnTenant() {
    this._store.dispatch(permissionActions.resetLayersBaseOnTenant())
  }

  public resetUserBaseOnTenant() {
    this._store.dispatch(permissionActions.resetUserBaseOnTenant())
  }

  public getTemplateUsers(tenantId, templateId){
    this._store.dispatch(permissionActions.getTemplateUsers({templateId, tenantId}))
  }

  public saveTemplate(templateState: PermissionTemplateState) {
    this._store.dispatch(permissionActions.saveTemplate({templateState}))
  }

  public updateTemplate(templateState: PermissionTemplateState) {
    this._store.dispatch(permissionActions.updateTemplate({templateState}))
  }

  public patchTemplateState(tenantId: string, templateId: string, layers: any[]){
    this._store.dispatch(permissionActions.patchTemplateState({templateId, tenantId, layers}))
  }

  public cancelUpdatingTemplate(){
    this._store.dispatch(permissionActions.cancelUpdatingTemplate())
  }

  public updateTemplateUser(username) {
    this._store.dispatch(permissionActions.updateTemplateUsersStoreByUsername({username, user: { username, updating: true, success: null, error: null } as TemplateUserState}))
    this._store.dispatch(permissionActions.updateTemplateUser({ username }))
  }
}
