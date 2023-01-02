export enum TENANT_STATUS {
    LIVE = 'Live',
    BETA = 'Beta',
    LAPSED = 'Lapsed'
}

export interface ITenantStatus {
    id: string;
    name: string;
}
