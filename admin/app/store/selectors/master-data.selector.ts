import { createSelector } from '@ngrx/store';
import { IAppState } from '../state/app.state';
import { IConfigState } from '../state/config.state';
import { ITenant } from '../../shared/models/tenant';
import { IClaim } from '../../shared/models/permisions';
import { IMembershipLevel } from '../../shared/models/membershipLevel';
import { ITenantStatus } from '../../shared/models/tenantStatus';
import { IPermissionTemplate } from '../state/master-data.state';


const tenantsState = (state: IAppState) => state.masterData.tenants;
const claimsState = (state: IAppState) => state.masterData.claims;
const membershipLevelsState = (state: IAppState) => state.masterData.memberships;
const tenantStatusesState = (state: IAppState) => state.masterData.tenantStatus;
const templates = (state: IAppState) => state.masterData.templates;

export const selectTenants = createSelector(
    tenantsState,
    (state: ITenant[]) => state
);

export const selectClaims = createSelector(
    claimsState,
    (state: IClaim[]) => state
);

export const selectMemberships = createSelector(
    membershipLevelsState,
    (state: {[tenantId: string]: IMembershipLevel[]}, props) => state[props.tenantId]
);

export const selectTenantStatuses = createSelector(
    tenantStatusesState,
    (state: ITenantStatus[]) => state
);

export const selectTemplates = createSelector(
    templates,
    (state: {[tenantId: string]: IPermissionTemplate[]}, props) => state[props.tenantId]
);
