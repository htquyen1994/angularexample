export interface IJsonTile {
    zoom: number;
    localFeatures?: Array<any>;
    remoteFeatureIds?: Array<string>;
    remoteTileIds?: Array<string>;
}
export const API_BASE_HREF = `${location.pathname}/`;

export const KEY = {
    UPDATEOVERLAY: '_UPDATEOVERLAY',
    DELETEOVERLAY: '_DELETEOVERLAY'
};