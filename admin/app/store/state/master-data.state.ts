import { ITenant } from "../../shared/models/tenant";
import { IClaim } from "../../shared/models/permisions";
import { IMembershipLevel } from '../../shared/models/membershipLevel';
import { ITenantStatus, TENANT_STATUS } from '@admin-shared/models/tenantStatus';
import { ILayer } from '@admin-shared/models/layer';

export interface IMasterDataState {
    tenants: ITenant[];
    claims: IClaim[];
    memberships: { [tennatId: string]: IMembershipLevel[] };
    tenantStatus: ITenantStatus[];
    templates: {
        [tenantId: string]: IPermissionTemplate[]
    };
}

export const initialMasterDataState: IMasterDataState = {
    tenants: [],
    claims: [],
    memberships: {},
    tenantStatus: [{
        id: TENANT_STATUS.LIVE,
        name: TENANT_STATUS.LIVE
    }, {
        id: TENANT_STATUS.LAPSED,
        name: TENANT_STATUS.LAPSED
    }, {
        id: TENANT_STATUS.BETA,
        name: TENANT_STATUS.BETA
    }],
    templates: {}
};

export interface IPermissionTemplate {
    templateId: string;
    templateName: string;
    layers: ILayer[];
  }
