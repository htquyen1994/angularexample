import { createAction, props } from "@ngrx/store";
import { ILayer, ILayerGroup, IFilter } from '@client/app/shared/interfaces';
import { IErrorResponse } from '@client/app/shared';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { ICoreFilter, ICoreGroup } from '../../interfaces/layer.interface';

const GET_LAYERS = '[Layer - Layer] Get layers';
const GET_LAYERS_SUCCESS = '[Layer - Layer] Get layers success';
const GET_LAYERS_FAIL = '[Layer - Layer] Get layers fail';

const GET_FILTERS = '[Layer - Filter] Get filters';
const GET_FILTERS_SUCCESS = '[Layer - Filter] Get filters success';
const GET_FILTERS_FAIL = '[Layer - Filter] Get filters fail';

const UPDATE_FILTER_BY_LAYER_ID = '[Layer - Filter] Update filter by layer id';
const UPDATE_FILTER_BY_LAYER_ID_SUCCESS = '[Layer - Filter] Update filter by layer id success';
const UPDATE_FILTER_BY_LAYER_ID_FAIL = '[Layer - Filter] Update filter by layer id fail';

const getLayers = createAction(
  GET_LAYERS,
);

const getLayersSuccess = createAction(
  GET_LAYERS_SUCCESS,
  props<{ layers: ILayer[], layerGroups: ICoreGroup[] }>()
);

const getLayersFail = createAction(
  GET_LAYERS_FAIL,
  props<{ error: IErrorResponse }>()
);

const getFilters = createAction(
  GET_FILTERS,
);

const getFiltersSuccess = createAction(
  GET_FILTERS_SUCCESS,
  props<{ filters: ICoreFilter[] }>()
);

const getFiltersFail = createAction(
  GET_FILTERS_FAIL,
  props<{ error: IErrorResponse }>()
);

const updateFilterByLayerId = createAction(
  UPDATE_FILTER_BY_LAYER_ID,
  props<{ layerId: string, filters: IFilter[] }>()
);

const updateFilterByLayerIdSuccess = createAction(
  UPDATE_FILTER_BY_LAYER_ID_SUCCESS,
  props<{ layers: ILayer[] }>()
);

const updateFilterByLayerIdFail = createAction(
  UPDATE_FILTER_BY_LAYER_ID_FAIL,
  props<{ error: IErrorResponse }>()
);

export const layerActions = {
  getLayers,
  getLayersSuccess,
  getLayersFail,

  getFilters,
  getFiltersSuccess,
  getFiltersFail
}
