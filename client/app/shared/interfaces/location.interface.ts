import {LayerSource} from '../LayerSource';
import { IBoundingBox } from '../../iface/IBoundingBox';
import { OverlayShapeOptions } from './overlay-shape-interfaces';

export interface ILocation {
    id?: string;
    name: string;
    isDefault: boolean;
    locationType: string;
    coordinates: google.maps.LatLngLiteral;
    zoom?: number;
    boundBox?: IBoundingBox;
    shapeOpts?: OverlayShapeOptions;
    shapeId?: string;
    // icon?: string;
    source?: LayerSource;
    details?: string[];
    layerId?: string;
    icon?: string;
}
export enum ILocationSearchType{
  LOCATION= 1,
  GAZETTEER = 2,
  BNG_LATLNG = 3,
  NEAREST = 4
}
