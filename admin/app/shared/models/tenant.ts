import { ELicenceExpiresStatus } from '../enums'
export interface ITenant {
    id: string;
    name: string;
    legal_entity: string;
    account_manager: string;
    tenant_status: string;
    url: string;
    urls: string[];
    allowed_domains: any[];
    maxUsersPerMembershipLevel: number;
    userAllocation: string;
    notes: string;
    tenantLicenceExpires: string;
    licenceExpiresWarning?: ELicenceExpiresStatus;
}
