import { LayerSource } from "../LayerSource";
import { ILayer } from "./layer-interfaces";

export interface ILayerGroup {
    type: LayerSource;
    name: string;
    layers: ILayer[];
    isLocked: boolean;
    isCollapsed: boolean;
    isHavingSelectedRecords?: boolean;
    id?: number;
}

export interface ILayerGroupResponse {
    groups: {
        type: LayerSource;
        name: string;
        layerIds: string[];
        isLocked: boolean;
        isCollapsed: boolean;
    }[];
}
