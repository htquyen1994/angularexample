import { HubMessageType } from "../enums";

export interface IHubMessage {
    type?: HubMessageType;
    component: string;
    content: {
        action?: string;
        dataPackageId: string;
        operation?: any;
        layerId?: string;
        layerIds?: Array<string>;
        [s: string]: any
    };
}