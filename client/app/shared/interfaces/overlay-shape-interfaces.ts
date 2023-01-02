import { OverlayLabelType } from '../enums'
import { OverlayLabelPoint } from './overlay-label-interfaces'
import { LineStyle, LayerStyleType } from '../models/layer-style.model';
import { ILabelStyle } from '../models/label.model';

export interface OverlayShapeGeometry {
    type: string;
    coordinates: any[];
}

export interface OverlayShapeIcon {

}
export interface OverlayShapeIconSvg extends OverlayShapeIcon {
  path: string;
  viewbox: string;
}

export interface OverlayShapeOptions {
    isVisible?: boolean;
    isActive?: boolean;
    isSelected?: boolean;
    isEditable?: boolean;
    isSelectable?: boolean;

    isMeasurement?: boolean;
    isLabel?: boolean;
    // labelColumnId?: string;
    labelType?: OverlayLabelType;
    hasInfo?: boolean;

    icon?: string | OverlayShapeIconSvg;
    iconSize?: number;

    transparency?: number;
    fillColor?: string;

    strokeTransparency?: number;
    strokeColor?: string;
    strokeWeight?: number;
    strokeDasharray?: string;
    isDisplayStrokePoint?: boolean;

    geometry?: any;
    zIndex?: number;
    styleType?: LayerStyleType;
    lineStyle?: LineStyle;
    labelStyle?: ILabelStyle;
    clickable?: boolean;
    isNotOptimized?: boolean;
}

export interface OverlayShapeMeasurements {
    lengths: OverlayLabelPoint[];
    heights: google.maps.LatLng[];
    summary: OverlayLabelPoint[];
    info?: OverlayLabelPoint[];
}

export enum IconType {
  PATH = 'path',
  STRING= 'string'
}
