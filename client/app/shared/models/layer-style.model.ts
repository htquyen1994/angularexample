
interface ILayerStyleOptsBase {
    isDefault: boolean;
}

export interface ILayerStyleOptsBasic extends ILayerStyleOptsBase {
    icon: string;
    iconSize: number;
    transparency: number;
    fillColor: string;
    strokeTransparency: number;
    strokeWeight: number;
    strokeColor: string;
    zIndex: number;
    label: string;
    lineStyle: LineStyle;
    isDisplayStrokePoint?: boolean;
}

export interface ILayerStyleOptsSelection extends ILayerStyleOptsBase {
    isFilterApplied: boolean;
    columnName: string;
    joinColumnName: string;
    parentColumnValue: string;
    parentList: any[];
    transparency: number;
    strokeTransparency: number;
    strokeWeight: number;
    iconSize: number;
    list: ILayerStyleOptsSelectionList[];
    lineStyle: LineStyle;
    isDisplayStrokePoint?: boolean;
}

export interface ILayerStyleOptsSelectionList {
    name: string;
    value: string | number;
    icon: string;
    fillColor: string;
    strokeColor: string;
    zIndex: number;
    hidden?: boolean;
}

export interface ILayerStyleOptsGradient extends ILayerStyleOptsBase {
    isFilterApplied: boolean;
    columnName: string;
    valueFunction: ValueFunctionType;
    icon: string;
    iconSize: number;
    transparency: number;
    strokeTransparency: number;
    strokeColor: string;
    strokeWeight: number;
    gradient: string[];
    lineStyle: LineStyle;
    isDisplayStrokePoint?: boolean;
}

export interface ILayerStyleOptsHeatmap extends ILayerStyleOptsBase {
    columnName: string;
    transparency: number;
    gradient: string[];
}

export interface ILayerStyleOptsCluster extends ILayerStyleOptsBase {
  columnName: string;
  strokeTransparency: number,
  transparency: number;
  strokeColor: string;
  gradient: string[];
  mapType: ClusterType,
  isLabeling: boolean
}

export declare type ILayerStyleOpts =
    ILayerStyleOptsBasic
    | ILayerStyleOptsSelection
    | ILayerStyleOptsGradient
    | ILayerStyleOptsHeatmap;

export enum ValueFunctionType {
    LINEAR,
    LOGARITHM,
    NATURAL_LOGARITHM,
    EXPONENTIAL
}

export enum LayerStyleType {
    BASIC,
    SELECTION,
    GRADIENT,
    HEATMAP,
    CLUSTER
}

export enum LineStyle{
    SOLID,
    DASHED
}

export enum ClusterType {
  POINTS,
  AREA
}
