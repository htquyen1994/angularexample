import { LayerSource } from "../LayerSource";
import { IFilterJunction, ILayerColumnType } from "../enums";

export interface IFilterColumnFilter {
    operator: string;
    // junction: IFilterJunction;
    value: any;
    options?: any[];
    columnValueDistribution?: any;
    name?: string;
    type?: ILayerColumnType;
}

export interface IFilter {
    id: string;
    name: string;
    isDefault: boolean;
    displayColumns: string[];
    sortColumn: string;
    sortDirection: string;
    shape: IFilterColumnFilter;
    filters: {
        [columnName: string]: IFilterColumnFilter[];
    };
    junctions?: {
        [columnName: string]: IFilterJunction;
    };
    source?: LayerSource;
    isUpdated?: boolean;
    viewportShape?: any;
}

export interface FilterChange {
    layerId: string;
    filter: IFilter;
}
