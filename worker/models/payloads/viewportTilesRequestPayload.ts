import { Payload } from './Payload';
import { IBoundingBox } from '../../../client/app/iface/IBoundingBox';
import { IFilter } from '../../../client/app/shared/interfaces/filter-interfaces';

export class ViewportTilesRequestPayload extends Payload {
    layerId: string;
    viewport: IBoundingBox;
    filter: IFilter;
    zoomLevel :number;
    layer: any;
    isClusterOverlay: boolean;
    selectedIds: string[];
    updateAll: boolean;
    currentTiles: string[];
    isVoronoi?: boolean;
    viewPortChanged?: boolean;
    columnName?: string;
    currentZoom?: number;
    constructor() {
        super();
    }
}

