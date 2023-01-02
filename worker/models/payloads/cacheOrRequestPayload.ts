import { Payload } from './Payload';
export interface ICacheOrRequestItem {
    tileId: string;
    urlPathAndQuery: string;
}

export class CacheOrRequestPayload extends Payload {
    layerId: string;
    data: ICacheOrRequestItem | ICacheOrRequestItem[];
    updateAll: boolean;
    constructor(layerId: string,data: ICacheOrRequestItem | ICacheOrRequestItem[], updateAll: boolean) {
        super();
        this.updateAll = updateAll;
        this.layerId = layerId;
        this.data = data;
    }
}