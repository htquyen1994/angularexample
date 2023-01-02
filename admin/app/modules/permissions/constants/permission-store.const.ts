import { PermissionState } from '../interfaces'
export const permissionFeatureKey = 'permission';

export const initialPermissionState: PermissionState = {
  isLoading: false,
  usersBaseOnTenant: {
    tenantId: null,
    users: null,
    isLoading: false
  },
  layersBaseOnTenant: {
    tenantId: null,
    userName: null,
    layers: [],
    isLoading: false,
  },
  filterForm: {
    filterLayers: null,
    selectedTenant: null,
    selectedUser: null
  },
  templateState: {
    isLoading: false,
    layers: [],
    templateId: null,
    templateName:  null,
    tenantId: null,
    users: [],
    error: null
  }
};
