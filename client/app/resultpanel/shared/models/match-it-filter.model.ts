import { FormControl } from "@angular/forms";
import { LayerSource } from 'src/client/app/shared';

export interface MatchItFilter {
    name: string,
    id: string,
    matchCommonGeoColumnId: string,
    value: number,
}
export interface DataPacakgeBaseInfo {
    dataPackageId: string;
    owner: string;
    source: LayerSource
    dataViewName?: string;
}

export interface MatchItLayer extends DataPacakgeBaseInfo {
    columns: {
        columnId: string,
        values?: string[]
    }[];
}

export interface MatchItLayerFilter extends DataPacakgeBaseInfo {
    matchItColumns: MatchItColumn[];
}

export interface MatchItCriteria {
    desiredMatch: number;
    // shape: string;
    matchItLayerFilters: MatchItLayerFilter[];
    area: number;
    resolution: number;
}
export interface MatchItColumn {
    columnId: string;
    matchCommonGeoColumnId: string;
    weight: number;
    count: number;
    values?: MatchItColumnValue[];
}

export interface MatchItColumnValue {
    key: string;
    matchCommonGeoColumnId: string
}

export interface MatchItPolygon {
    areaKm2: number;
    label: string;
}

export enum MATCHITSTATES {
    FITLER,
    REVIEW
}

export interface MatchItWeightColumn {
    [columnName: string]: FormControl | MatchItWeightColumnValue;
}

export interface MatchItWeightColumnValue {
    [key: string]: FormControl;
}

export interface MatchItWeightLayer {
    [layerId: string]: MatchItWeightColumn;
}
