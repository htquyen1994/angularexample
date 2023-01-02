import { MEMBERSHIP_LEVEL } from "../../shared/models/membershipLevel";

export interface User {
    id: string;
    tenantId: number;
    username: string;
    forename: string;
    surname: string;
    membershipLevel: MEMBERSHIP_LEVEL;
    isEnabled: boolean;
    notes: string;
    created: string;
    last_logon: string;
    dataTemplate: string;
}
