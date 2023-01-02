import { createAction, props } from '@ngrx/store';
import { User } from '../../user-handler/user.interface';
import { IErrorResponse } from '../../../shared/models/error';
import { ILayer } from '../../../shared/models/layer';
import { FilterForm, TemplateUserState, PermissionTemplateState } from '../interfaces';

const ResetUserBaseOnTenant = '[Permission] Reset Users Data Base On Tennant';
const GetUserBaseOnTenant = '[Permission] Get Users Data Base On Tennant';
const GetUserBaseOnTenantSuccess = '[Permission] Get Users Data Base On Tennant Success';
const GetUserBaseOnTenantFailure = '[Permission] Get Users Data Base On Tennant Failure';
const ResetLayersBaseOnTenant = '[Permission] Reset Layers Data Base On Tennant';
const GetLayersBaseOnTenant = '[Permission] Get Layers Data Base On Tennant';
const GetLayersBaseOnTenantSuccess = '[Permission] Get Layers Data Base On Tennant Success';
const GetLayersBaseOnTenantFailure = '[Permission] Get Layers Data Base On Tennant Failure';
const SetFilterPermissions = '[Permission] Set Filter Permissions';

const GET_TEMPLATE_USERS = '[Permission - TEMPLATE] Get users template';
const GET_TEMPLATE_USERS_SUCCESS = '[Permission - TEMPLATE] Get users template success';
const GET_TEMPLATE_USERS_FAIL = '[Permission - TEMPLATE] Get users template fail';

const SEQUENCE_UPDATE_TEMPLATE_USERS = '[Permission - TEMPLATE] Sequence update template users';
const UPDATE_TEMPLATE_USER = '[Permission - TEMPLATE] Update template user';
const UPDATE_TEMPLATE_USER_SUCCESS = '[Permission - TEMPLATE] Update template user success';
const UPDATE_TEMPLATE_USER_FAIL = '[Permission - TEMPLATE] Update template user fail';
const UPDATE_TEMPLATE_USER_STORE_BY_USERNAME = '[Permission - TEMPLATE] Update template users store by username'
const UPDATE_TEMPLATE_USER_STORE = '[Permission - TEMPLATE] Update template users store';

const PATCH_TEMPLATE_STATE = '[Permission - TEMPLATE] Patch template state';
const PATCH_TEMPLATE_STATE_SUCCESS = '[Permission - TEMPLATE] Patch template state success';

const SAVE_TEMPLATE = '[Permission - TEMPLATE] Save template';
const SAVE_TEMPLATE_SUCCESS = '[Permission - TEMPLATE] Save template success';
const SAVE_TEMPLATE_FAIL = '[Permission - TEMPLATE] Save template fail';

const UPDATE_TEMPLATE = '[Permission - TEMPLATE] Update template';
const UPDATE_TEMPLATE_SUCCESS = '[Permission - TEMPLATE] Update template success';
const UPDATE_TEMPLATE_FAIL = '[Permission - TEMPLATE] Update template fail';

const CANCEL_UPDATING_TEMPLATE = '[Permission - TEMPLATE] Cancel updating template';


const resetUserBaseOnTenant = createAction(
  ResetUserBaseOnTenant,
);

const getUserBaseOnTenant = createAction(
  GetUserBaseOnTenant,
  props<{ payload: string }>()
);

const getUserBaseOnTenantSuccess = createAction(
  GetUserBaseOnTenantSuccess,
  props<{
    payload: {
      tenantId: string,
      users: User[]
    }
  }>()
);

const getUserBaseOnTenantFailure = createAction(
  GetUserBaseOnTenantFailure,
  props<{ payload: IErrorResponse }>()
);

const resetLayersBaseOnTenant = createAction(
  ResetLayersBaseOnTenant,
);

const getLayersBaseOnTenant = createAction(
  GetLayersBaseOnTenant,
  props<{ payload: { tenantId: string, userName: string } }>()
);

const getLayersBaseOnTenantSuccess = createAction(
  GetLayersBaseOnTenantSuccess,
  props<{
    payload: {
      tenantId: string,
      userName: string,
      layers: ILayer[]
    }
  }>()
);

const getLayersBaseOnTenantFailure = createAction(
  GetLayersBaseOnTenantFailure,
  props<{ payload: IErrorResponse }>()
);

const setFilterPermissions = createAction(
  SetFilterPermissions,
  props<{ payload: FilterForm }>()
);

const getTemplateUsers = createAction(
  GET_TEMPLATE_USERS,
  props<{ tenantId: string, templateId: string }>()
)

const getTemplateUsersSuccess = createAction(
  GET_TEMPLATE_USERS_SUCCESS,
  props<{ users: TemplateUserState[] }>()
)

const getTemplateUsersFail = createAction(
  GET_TEMPLATE_USERS_FAIL,
  props<{ error: IErrorResponse }>()
)

const sequenceUpdateTemplateUser = createAction(
  SEQUENCE_UPDATE_TEMPLATE_USERS,
)

const updateTemplateUser = createAction(
  UPDATE_TEMPLATE_USER,
  props<{ username: string }>()
)

const updateTemplateUserSuccess = createAction(
  UPDATE_TEMPLATE_USER_SUCCESS,
  props<{ username: string  }>()
)

const updateTemplateUserFail = createAction(
  UPDATE_TEMPLATE_USER_FAIL,
  props<{ username:string, error: IErrorResponse }>()
)

const updateTemplateUsersStoreByUsername = createAction(
  UPDATE_TEMPLATE_USER_STORE_BY_USERNAME,
  props<{ username: string, user: any  }>()
)

const updateTemplateUsersStore = createAction(
  UPDATE_TEMPLATE_USER_STORE,
  props<{ users: TemplateUserState[] }>()
)

const patchTemplateState = createAction(
  PATCH_TEMPLATE_STATE,
  props<{ tenantId: string, templateId: string, layers: ILayer[]  }>()
)

const patchTemplateStateSuccess = createAction(
  PATCH_TEMPLATE_STATE_SUCCESS,
  props<{ templateState: PermissionTemplateState  }>()
)

const saveTemplate = createAction(
  SAVE_TEMPLATE,
  props<{ templateState: PermissionTemplateState }>()
)

const saveTemplateSuccess = createAction(
  SAVE_TEMPLATE_SUCCESS,
)

const saveTemplateFail = createAction(
  SAVE_TEMPLATE_FAIL,
  props<{ error: IErrorResponse }>()
)

const updateTemplate = createAction(
  UPDATE_TEMPLATE,
  props<{ templateState: PermissionTemplateState }>()
)

const updateTemplateSuccess = createAction(
  UPDATE_TEMPLATE_SUCCESS,
)

const updateTemplateFail = createAction(
  UPDATE_TEMPLATE_FAIL,
  props<{ error: IErrorResponse }>()
)

const cancelUpdatingTemplate = createAction(
  CANCEL_UPDATING_TEMPLATE,
)

export const permissionActions = {
  resetUserBaseOnTenant,
  getUserBaseOnTenant,
  getUserBaseOnTenantSuccess,
  getUserBaseOnTenantFailure,
  resetLayersBaseOnTenant,
  getLayersBaseOnTenant,
  getLayersBaseOnTenantSuccess,
  getLayersBaseOnTenantFailure,
  setFilterPermissions,
  getTemplateUsers,
  getTemplateUsersSuccess,
  getTemplateUsersFail,
  sequenceUpdateTemplateUser,
  updateTemplateUser,
  updateTemplateUserSuccess,
  updateTemplateUserFail,
  updateTemplateUsersStoreByUsername,
  updateTemplateUsersStore,
  patchTemplateState,
  patchTemplateStateSuccess,
  saveTemplate,
  saveTemplateSuccess,
  saveTemplateFail,
  updateTemplate,
  updateTemplateSuccess,
  updateTemplateFail,
  cancelUpdatingTemplate
}
