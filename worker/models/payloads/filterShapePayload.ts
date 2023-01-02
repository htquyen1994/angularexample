import { Payload } from './Payload';
import { IFilter } from '../../../client/app/shared/interfaces/filter-interfaces';

export class FilterShapesPayload extends Payload {
    tileId: string;
    filter: IFilter;
    layer: any;
    features: any[];
    selectedIds: string[];
    constructor(tileId: string,filter: IFilter, layer: any, features: any[], selectedIds: string[]) {
        super();
        this.tileId = tileId;
        this.filter = filter;
        this.layer = layer;
        this.features = features;
        this.selectedIds = selectedIds
    }
}