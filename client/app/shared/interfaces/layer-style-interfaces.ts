import { LayerStyle } from "../layer-style";
import { ILayerStyleOpts, LayerStyleType } from "../models/layer-style.model";

export interface ILayerStyleChange {
    layerId: string;
    style: LayerStyle;
}

export interface ILayerStyleList {
    [layerId: string]: LayerStyle[];
}

export interface LayerStyleStore {
    [layerId: string]: {
        name: string;
        isDefault: boolean,
        type: LayerStyleType;
        opts: ILayerStyleOpts;
    }[];
}

export interface ILayerColourRamp {
    name: string;
    colours: string[];
}