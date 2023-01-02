
import { ViewportTilesRequestPayload } from './ViewportTilesRequestPayload';

export class TilesHandlingPayload extends ViewportTilesRequestPayload {
    tileIds: string[];
    constructor() {
        super();
    
    }
}

