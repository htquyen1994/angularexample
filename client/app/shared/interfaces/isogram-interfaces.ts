import { TravelType } from "../enums";

export interface TravelModel {
    mode: string;
    valueTime: number;
    valueDistance: number;
    value?: number;
    towardsOrigin: boolean;
    type: TravelType;
    isDetail: boolean;
    scenario: string;
}


export interface IsogramRequest {
    TravelType: TravelType;
    TravelValue: number;
    Origin: number[];
    TravelMode: string;
    ReverseFlow: boolean;
    Complex: boolean;
    Scenario: string;
}
