import { createAction, props } from "@ngrx/store";

const GET_SHAPES_BY_POLYGON = '[MAP TOOL - SELECTION MAP] Get shapes by polygon';
const GET_SHAPES_BY_POLYGON_SUCCESS = '[MAP TOOL - SELECTION MAP] Get shapes by polygon success';
const GET_SHAPES_BY_POLYGON_FAIL = '[MAP TOOL - SELECTION MAP] Get shapes by polygon fail';


const getShapesByPolygon = createAction(
  GET_SHAPES_BY_POLYGON,
  props<{ shapeId: string, overlayId: string }>()
);

const getShapesByPolygonSuccess = createAction(
  GET_SHAPES_BY_POLYGON_SUCCESS,
);

const getShapesByPolygonFail = createAction(
  GET_SHAPES_BY_POLYGON_FAIL,
);

export const mapToolsActions = {
  getShapesByPolygon,
  getShapesByPolygonSuccess,
  getShapesByPolygonFail
}
