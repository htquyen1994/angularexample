import { Action, createReducer, on } from '@ngrx/store';
import {permissionActions} from '../actions/permission.actions';
import { PermissionState } from '../interfaces';
import { initialPermissionState } from '../constants'


const _permissionReducer = createReducer<PermissionState>(
  initialPermissionState,
  on(permissionActions.resetUserBaseOnTenant, (state, action) => ({
    ...state,
    usersBaseOnTenant: {
      ...initialPermissionState.usersBaseOnTenant
    }
  })),
  on(permissionActions.getUserBaseOnTenant, (state, action) => ({
    ...state, usersBaseOnTenant: {
      tenantId: action.payload,
      users: null,
      isLoading: true
    }
  })),
  on(permissionActions.getUserBaseOnTenantSuccess, (state, action) => ({
    ...state, usersBaseOnTenant: {
      ...action.payload,
      isLoading: false
    }
  })),
  on(permissionActions.getUserBaseOnTenantFailure, (state, action) => ({ ...state, error: action.payload })),
  on(permissionActions.resetLayersBaseOnTenant, (state, action) => ({
    ...state,
    layersBaseOnTenant: {
      isLoading: false,
      tenantId: null,
      userName: null,
      layers: [],
      templates: null
    }
  })),
  on(permissionActions.getLayersBaseOnTenant, (state, action) => ({
    ...state, layersBaseOnTenant: {
      isLoading: true,
      tenantId: action.payload.tenantId,
      userName: action.payload.userName,
      layers: [],
    }
  })),
  on(permissionActions.getLayersBaseOnTenantSuccess, (state, action) => ({
    ...state, layersBaseOnTenant: {
      ...state.layersBaseOnTenant,
      ...action.payload,
      isLoading: false,
    }
  })),
  on(permissionActions.getLayersBaseOnTenantFailure, (state, action) => ({ ...state, error: action.payload, isLoading: true })),
  on(permissionActions.setFilterPermissions, (state, action) => ({
    ...state, filterForm: {
      ...state.filterForm,
      ...action.payload
    }
  })),
  on(permissionActions.getTemplateUsers, (state, action) => ({
    ...state,
    templateState: {
      ...state.templateState,
      isLoading: true,
    }
  })),
  on(permissionActions.getTemplateUsersSuccess, (state, action) => ({
    ...state,
    templateState: {
      ...state.templateState,
      isLoading: false,
      users: action.users
    }
  })),
  on(permissionActions.getTemplateUsersFail, (state, action) => ({
    ...state,
    templateState: {
      ...state.templateState,
      isLoading: false,
    }
  })),
  on(permissionActions.patchTemplateStateSuccess, (state, action) => ({
    ...state,
    templateState: action.templateState
  })),
  on(permissionActions.updateTemplateUsersStore, (state, action) => ({
    ...state,
    templateState: {
      ...state.templateState,
      users: action.users
    }
  })),
  on(permissionActions.updateTemplate, (state, action) => ({
    ...state,
    templateState: {
      ...state.templateState,
      isLoading: true,
      error: null
    }
  })),
  on(permissionActions.updateTemplateSuccess, (state, action) => ({
    ...state,
    templateState: {
      ...state.templateState,
      isLoading: false
    }
  })),
  on(permissionActions.updateTemplateFail, (state, action) => ({
    ...state,
    templateState: {
      ...state.templateState,
      isLoading: false,
      error: action.error
    }
  })),
);

export function permissionReducer(state: PermissionState | undefined, action: Action) {
  return _permissionReducer(state, action);
}
