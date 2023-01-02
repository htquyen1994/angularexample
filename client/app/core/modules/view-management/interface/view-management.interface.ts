import { ECatchmentType, LayerSource } from "../../../enums";
import { ILayer } from '@client/app/shared/interfaces';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { IErrorResponse } from '@client/app/shared';
import { TravelMode, TravelType, TravelUnit } from '../enums';

export interface IViewManagementState {
  insight: IInsightViewManagementState;
}

export interface IViewManagementLayerGroupOption {
  id: string;
  name: string;
}

export interface ILayerInsightView extends ILayer {
  columnGroupOptions: PsSelectOption[]
}

export interface IInsightViewManagementState {
  loading: boolean;
  error: IErrorResponse;
  views: IInsightView[];
  gettingLayer: boolean;
  layerGroupOptions: PsSelectOption[];
  layers: ILayerInsightView[];
  editingView: IInsightView;
  isUpdating: boolean;
  updatingError: IErrorResponse;
}

export interface IInsightLayer {
  layerId: string;
  columnIds: string[];
}

export interface IView {
  id: string;
  name: string;
  isDefault: boolean;
  source?: LayerSource;
}


export interface IInsightView extends IView {
  catchments: ICatchmentView[];
  layers: IInsightLayer[];
}


export interface ICatchmentView {
  value: number;
  mode: TravelMode;
  toOrigin: boolean;
  isDetail: boolean;
  type: TravelType;
  unit: TravelUnit;
}
