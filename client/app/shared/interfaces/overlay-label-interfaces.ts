import { OverlayShapeType } from '../enums'

export interface OverlayLabelPoint {
    point: google.maps.LatLng;
    value?: number;
    label?: string;
    isEditable?: boolean;
}

export interface OverlayLabelOptions {
    x?: number;
    y?: number;
    positionX?: string;
    positionY?: string;
    type?: OverlayShapeType;
    zIndex?: string;
} 