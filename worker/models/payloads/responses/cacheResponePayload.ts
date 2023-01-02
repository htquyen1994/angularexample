import { Payload } from '../Payload';

export class CacheResponsePayload extends Payload {
    tileData: CacheItemResponsePayload[] | any[];
    tileId: string;
    constructor(tileId: string, data: CacheItemResponsePayload[]) {
        super();
        this.tileData = data.map(e => new CacheItemResponsePayload(e));
        this.tileId = tileId;
    }
}

export class CacheItemResponsePayload extends Payload {
    localFeatures: any[];
    remoteFeatureIds: string[];
    remoteTileIds: string[];
    zoom: number;
    constructor(data: any) {
        super();
        this.localFeatures = data['localFeatures'] || [];
        this.remoteFeatureIds = data['remoteFeatureIds'] || [];
        this.remoteTileIds = data['remoteTileIds'] || [];
        this.zoom = data['zoom'];
    }
}