export const MATCH_STATISTIC_COLUMN = 'Ranking'

export enum CreateMatchLayerMethod {
    shapefile,
    newlayer
}

export interface IMatchLayerRequest {
    layerName: string
    createMethod: string
}
