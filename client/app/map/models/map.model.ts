import { OverlayShapeGeometry } from '../../shared/interfaces';
import { LayerSource } from '../../shared';

export interface QuickEdit{
    shapes: QuickEditShape[];
}

export interface QuickEditShape {
    id: string;
    layerId: string;
    layerName: string;
    geomColumnValue: OverlayShapeGeometry;
    geomColumnName: string;
    identifierColumnName: string;
    identifierColumnValue: any;
    source: LayerSource,
    owner: string
}

export interface QuickEditAction {
    id: string;
    previous: any[];
    current: any[];
}

export interface QuickEditShapeDTO {
    geomColumnName: string;
    geomColumnValue: string;
    identifierColumnName: string;
    identifierColumnValue: any;
}

export interface QuickEditDTO {
    layerId: string;
    changes: QuickEditShapeDTO[];
    source: LayerSource,
    owner: string
}
