import { Subscription } from "rxjs";

export interface OverlayDataItem {
    id: string;
    data: any;
    tile: IOverlayTile;
}

export interface IOverlayTile {
    id: string;
    shapes: Set<OverlayDataItem>;
    remoteTiles: Set<string>;
    isDeleted?: boolean;
}
