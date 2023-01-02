import { IFeature, IGeometry } from "../map-utils/shapes";
import { ILabelStyle } from '../models/label.model';

export interface IJsonTile {
    zoom: number;
    localFeatures?: Array<IFeature<IGeometry>>;
    remoteFeatureIds?: Array<string>;
}

// export interface ILabelChange {
//     overlayId: string;
//     columnId: string;
// }

export interface ILabelStyleChange {
    overlayId: string;
    style: ILabelStyle;
}