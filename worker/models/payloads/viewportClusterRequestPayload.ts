import { ViewportTilesRequestPayload } from './ViewportTilesRequestPayload';

export class ViewportClusterRequestPayload extends ViewportTilesRequestPayload {
    MaxIterations: number;
    MaxDeviation: number;
    InitialClusters: number;
    ClippingGeometryNames:string[];
}
