import { ILayer } from "./layer-interfaces";
import { OverlayShape } from "../overlay-shape";
import { Observable } from "rxjs/internal/Observable";
import { LayerSource } from "../LayerSource";
import { IInsightCatchmentType } from "../enums";
import { MatchItPolygon } from "../../resultpanel/shared/models/match-it-filter.model";

export interface IInsightLayer {
    layerId: string;
    columnIds: string[];
}

export interface PolygonRequest {
    label: string;
    type?: string;
    shape: Observable<OverlayShape>;
    id?: string;
}
export interface IInsight {
    id: string;
    name: string;
    isDefault: boolean;
    source?: LayerSource;
    catchments: {
        type: IInsightCatchmentType;
        directionFromOrigin: boolean;
        value: number;
    }[];
    layers: IInsightLayer[];
}

export interface InsightResult {
    layer: ILayer;
    data: {
        name: string;
        children: {
            columnId: string;
            label: string;
            values: number;
            unit: string;
            average: number;
            averageLabel: number;
            min: number | null;
            max: number | null;
        }[];
    }[];
    polygons: MatchItPolygon[];
}
