import { createAction, props } from "@ngrx/store";
import { ICoreFilter } from '../../../core/interfaces';
import { OverlayShapeGeometry } from '@client/app/shared/interfaces';
import { IErrorResponse } from '@client/app/shared';

const CHANGE_LAYER = '[Nearest - Tool] Change layer';
const SET_FILTERS = '[Nearest - Tool] Set filters';

const GET_SHAPES = '[Nearest - Tool] Get shapes';
const GET_SHAPES_SUCCESS = '[Nearest - Tool] Get shapes success';
const GET_SHAPES_FAIL = '[Nearest - Tool] Get shapes fail';

const changeLayer = createAction(
  CHANGE_LAYER,
  props<{ layerId: string }>()
);

const setFilters = createAction(
  SET_FILTERS,
  props<{ filter: ICoreFilter }>()
);

const getShapes = createAction(
  GET_SHAPES
);

const getShapesSuccess = createAction(
  GET_SHAPES_SUCCESS,
  props<{ shapes: OverlayShapeGeometry[] }>()
);

const getShapesFail = createAction(
  GET_SHAPES_FAIL,
  props<{ error: IErrorResponse }>()
);

export const nearestToolActions = {
  changeLayer,
  setFilters,
  getShapes,
  getShapesSuccess,
  getShapesFail
}
