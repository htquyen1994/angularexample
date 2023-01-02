import { createAction, props } from "@ngrx/store";
import { ITenant } from "../../shared/models/tenant";
import { IErrorResponse } from "../../shared/models/error";
import { IClaim } from "../../shared/models/permisions";
import { IMembershipLevel } from '../../shared/models/membershipLevel';
import { IPermissionTemplate } from '../state/master-data.state';

export enum EMasterData {
    GetTenants = '[Master Data] Get Tenants Data',
    GetTenantsSuccess = '[Master Data] Get Tenants Data Success',
    GetTenantsFailure = '[Master Data] Get Tenants Data Failure',
    GetClaims = '[Master Data] Get Claims',
    GetClaimsSuccess = '[Master Data] Get Claims Success',
    GetClaimsFailure = '[Master Data] Get Claims Failure',
    GetMemberships = '[Master Data] Get Membership Data',
    GetMembershipsSuccess = '[Master Data] Get Memberships Success',
    GetMembershipsFailure = '[Master Data] Get Memberships Failure',
    LoadPermissionTemplates = '[Master Data] Load Permission Templates',
    LoadPermissionTemplatesSuccess = '[Master Data] Load Permission Templates Success',
    LoadPermissionTemplatesFailure = '[Master Data] Load Permission Templates Failure',
}

export const getTenants = createAction(
    EMasterData.GetTenants
);

export const getTenantsSuccess = createAction(
    EMasterData.GetTenantsSuccess,
    props<{ payload: ITenant[] }>()
);

export const getTenantsFailure = createAction(
    EMasterData.GetTenantsFailure,
    props<{ payload: IErrorResponse }>()
);

export const getClaims = createAction(
    EMasterData.GetClaims
);

export const getClaimsSuccess = createAction(
    EMasterData.GetClaimsSuccess,
    props<{ payload: IClaim[] }>()
);

export const getClaimsFailure = createAction(
    EMasterData.GetClaimsFailure,
    props<{ payload: IErrorResponse }>()
);

export const getMemberships = createAction(
    EMasterData.GetMemberships,
    props<{ payload: string  }>()
);

export const getMembershipsSuccess = createAction(
    EMasterData.GetMembershipsSuccess,
    props<{ payload: {
        tenantId: string;
        memberShipLevels: IMembershipLevel[];
    } }>()
);

export const getMembershipsFailure = createAction(
    EMasterData.GetMembershipsFailure,
    props<{ payload: IErrorResponse }>()
);


export const loadPermissionTemplates = createAction(
    EMasterData.LoadPermissionTemplates,
    props<{ payload: { tenantId: string } }>()
  );

  export const loadPermissionTemplatesSuccess = createAction(
    EMasterData.LoadPermissionTemplatesSuccess,
    props<{ payload: { tenantId: string, data: IPermissionTemplate[] } }>()
  );
  export const loadPermissionTemplatesFailure = createAction(
    EMasterData.LoadPermissionTemplatesFailure,
    props<{ payload: IErrorResponse }>()
  );

