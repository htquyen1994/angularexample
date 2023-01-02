export enum EDetailPanelTabs {
    BranchDetails,
    BranchPeople,
    OutreachServices,
    Security,
    CustomerSessions,
    OpeningHours,
    Images,
    Documents,
    Information,
    NearestLocations
}

export interface IBranchDetail {
    groups: IGroup[];
    name: string
}

export interface IGroup {
    name: string;
    details: IGroup_Detail[];
}
export interface IGroup_Detail {
    name: string;
    value: string | string[] | number | number[];
    isArray?: boolean;
    formatPipe?: string;
    format?: string;
}

export interface IOpeningHours {
    name: string;
    datas: {
        [key: string]: any,
    }[];
    payStationDatas: {
        [key: string]: any,
    }[];
    hours: number;
}

export interface IOutreachServices {
    fadCode: string;
    coreBranch: string;
    outreachCluster: string;
    coreLng: number;
    coreLat: number;
    outreaches: any[];
}


export enum OpeningHoursData {
    OPEN = 'Open',
    LunchStart = 'LunchStart',
    LunchEnd = 'LunchEnd',
    Close = 'Close'
}

export enum OpeningHoursDay {
    MONDAY = 'Mon',
    TUESDAY = 'Tues',
    WEDNESDAY = 'Wed',
    THURSDAY = 'Thur',
    FRIDAY = 'Fri',
    SATURDAY = 'Sat',
    SUNDAY = 'Sun'
}


export enum OpeningHoursPayStation {
    AM_TIME_FROM = 'AM_TIME_FROM',
    AM_TIME_TO = 'AM_TIME_TO',
    PM_TIME_FROM = 'PM_TIME_FROM',
    PM_TIME_TO = 'PM_TIME_TO'
}

export enum OpeningHoursPayStationDay {
    MONDAY = 'PP_Monday',
    TUESDAY = 'PP_Tuesday',
    WEDNESDAY = 'PP_Wednesday',
    THURSDAY = 'PP_Thursday',
    FRIDAY = 'PP_Friday',
    SATURDAY = 'PP_Saturday',
    SUNDAY = 'PP_Sunday'
}

export enum TypeOfImage {
    BranchImages = "BranchImages",
    RetailerImages = "RetailerImages"
}
