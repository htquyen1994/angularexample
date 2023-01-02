import { User } from '@admin-modules/user-handler/user.interface';
import { ILayer } from '@admin-shared/models/layer';
import { IErrorResponse } from '@admin-shared/models/error';
import { IPermissionTemplate } from 'src/admin/app/store/state/master-data.state';

export interface IPermissionsGridData {
    layerId: string;
    layerName: string;
    groupId: string;
    groupName: string;
    claimsData: { [key: string]: number }; //0 false, 1 true, 2 indeterminate
    enabled: { [key: string]: boolean };
    programaticName: string;
    children?: IPermissionsGridData[];
    collapsed?: boolean;
}



export interface FilterForm {
  selectedTenant?: string;
  selectedUser?: string;
  filterLayers?: string[];
}

export interface UsersBaseOnTenantState {
  tenantId: string;
  users: User[];
  isLoading: boolean;
}

export interface LayersBaseOnTenant {
  tenantId: string;
  userName: string;
  layers: ILayer[];
  isLoading: boolean;
}

export interface TemplateUserState {
  username: string;
  updating: boolean;
  success: boolean;
  error: IErrorResponse
}

export interface PermissionTemplateState extends IPermissionTemplate {
  isLoading: boolean;
  error: IErrorResponse;
  tenantId: string;
  users: TemplateUserState[]
}
export interface PermissionState {
  isLoading: boolean;
  usersBaseOnTenant: UsersBaseOnTenantState;
  layersBaseOnTenant: LayersBaseOnTenant;
  filterForm: FilterForm;
  templateState: PermissionTemplateState;
}
