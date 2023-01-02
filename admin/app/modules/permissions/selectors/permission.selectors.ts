import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PermissionState } from '../interfaces';
import { permissionFeatureKey } from '../constants';

const selectPermissionState = createFeatureSelector<PermissionState>(
  permissionFeatureKey
);

const selectUsersBaseOnTenant = createSelector(
    selectPermissionState,
    (state) => state.usersBaseOnTenant
);
const selectLayersBaseOnTenant = createSelector(
    selectPermissionState,
    (state) => state.layersBaseOnTenant
);
const selectFilterForm = createSelector(
  selectPermissionState,
  (state) => state.filterForm
);

const selectedTemplateState = createSelector(
  selectPermissionState,
  (state) => state.templateState
);

const selectedTemplateUsers = createSelector(
  selectedTemplateState,
  (state) => state.users
);

const selectedTemplateLoading = createSelector(
  selectedTemplateState,
  (state) => state.isLoading
);

export const permissionSelectors = {
  selectUsersBaseOnTenant,
  selectLayersBaseOnTenant,
  selectFilterForm,
  selectedTemplateState,
  selectedTemplateUsers,
  selectedTemplateLoading
}

