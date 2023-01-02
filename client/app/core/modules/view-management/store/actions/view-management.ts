import { createAction, props } from "@ngrx/store";
import { IInsightView, ILayerInsightView } from "../../interface";
import { IErrorResponse } from '@client/app/shared';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';


const GETTING_INSIGHT_VIEW = '[View Management - insight] Getting insight views';
const GETTING_INSIGHT_VIEW_SUCCESS = '[View Management - insight] Getting insight views success';
const GETTING_INSIGHT_VIEW_FAIL = '[View Management - insight] Getting insight views fail';

const GETTING_VIEW_MANAGEMENT_LAYERS = '[View Management - layers] Getting layers';
const GETTING_VIEW_MANAGEMENT_LAYERS_SUCCESS = '[View Management - layers] Getting layers success';
const GETTING_VIEW_MANAGEMENT_LAYERS_FAIL = '[View Management - layers] Getting layers fail';

const EDIT_INSIGHT_VIEW = '[View Management - insight] Edit insight view';
const EDIT_INSIGHT_VIEW_SUCCESS = '[View Management - insight] Edit insight view success';
const EDIT_INSIGHT_VIEW_FAIL = '[View Management - insight] Edit insight view fail';
const EDIT_INSIGHT_VIEW_REFRESH = '[View Management - insight] Refresh Edit insight view';

const CREATE_INSIGHT_VIEW = '[View Management - insight] Create insight view';
const CREATE_INSIGHT_VIEW_SUCCESS = '[View Management - insight] Create insight view success';
const CREATE_INSIGHT_VIEW_FAIL = '[View Management - insight] Create insight view fail';

const UPDATE_INSIGHT_VIEW = '[View Management - insight] Update insight view';
const UPDATE_INSIGHT_VIEW_SUCCESS = '[View Management - insight] Update insight view success';
const UPDATE_INSIGHT_VIEW_FAIL = '[View Management - insight] Update insight view fail';

const DELETE_INSIGHT_VIEW = '[View Management - insight] Delete insight view';
const DELETE_INSIGHT_VIEW_SUCCESS = '[View Management - insight] Delete insight view success';
const DELETE_INSIGHT_VIEW_FAIL = '[View Management - insight] Delete insight view fail';

const COPY_INSIGHT_VIEW = '[View Management - insight] Copy insight view';
const COPY_INSIGHT_VIEW_SUCCESS = '[View Management - insight] Copy insight view success';
const COPY_INSIGHT_VIEW_FAIL = '[View Management - insight] Copy insight view fail';

const SHARE_INSIGHT_VIEW = '[View Management - insight] Share insight view';
const SHARE_INSIGHT_VIEW_SUCCESS = '[View Management - insight] Share insight view success';
const SHARE_INSIGHT_VIEW_FAIL = '[View Management - insight] Share insight view fail';

const getInsightViews = createAction(
  GETTING_INSIGHT_VIEW,
);

const getInsightViewsSuccess = createAction(
  GETTING_INSIGHT_VIEW_SUCCESS,
  props<{ views: IInsightView[] }>()
);

const getInsightViewsFail = createAction(
  GETTING_INSIGHT_VIEW_FAIL,
  props<{ error: IErrorResponse }>()
);

const getViewManagementLayers = createAction(
  GETTING_VIEW_MANAGEMENT_LAYERS
)

const getViewManagementLayersSuccess = createAction(
  GETTING_VIEW_MANAGEMENT_LAYERS_SUCCESS,
  props<{  layerGroupOptions: PsSelectOption[], layers: ILayerInsightView[] }>()
)

const getViewManagementLayersFail = createAction(
  GETTING_VIEW_MANAGEMENT_LAYERS_FAIL,
  props<{ error: IErrorResponse }>()
)

const editInsightView = createAction(
  EDIT_INSIGHT_VIEW,
  props<{ id: string }>()
)

const editInsightViewSuccess = createAction(
  EDIT_INSIGHT_VIEW_SUCCESS,
  props<{ view: IInsightView }>()
)

const editInsightViewFail = createAction(
  EDIT_INSIGHT_VIEW_FAIL,
  props<{ error: IErrorResponse }>()
)

const refreshEditingView = createAction(
  EDIT_INSIGHT_VIEW_REFRESH
)

const createInsightView = createAction(
  CREATE_INSIGHT_VIEW,
  props<{ view: IInsightView }>()
)

const createInsightViewSuccess = createAction(
  CREATE_INSIGHT_VIEW_SUCCESS,
  props<{ views: IInsightView[] }>()
)

const createInsightViewFail = createAction(
  CREATE_INSIGHT_VIEW_FAIL,
  props<{ error: IErrorResponse }>()
)

const updateInsightView = createAction(
  UPDATE_INSIGHT_VIEW,
  props<{ id: string, view: IInsightView }>()
)

const updateInsightViewSuccess = createAction(
  UPDATE_INSIGHT_VIEW_SUCCESS,
  props<{ views: IInsightView[] }>()
)

const updateInsightViewFail = createAction(
  UPDATE_INSIGHT_VIEW_FAIL,
  props<{ error: IErrorResponse }>()
)

const deleteInsightView = createAction(
  DELETE_INSIGHT_VIEW,
  props<{ id: string }>()
)

const deleteInsightViewSuccess = createAction(
  DELETE_INSIGHT_VIEW_SUCCESS,
  props<{ views: IInsightView[] }>()
)

const deleteInsightViewFail = createAction(
  DELETE_INSIGHT_VIEW_FAIL,
  props<{ error: IErrorResponse }>()
)

const copyInsightView = createAction(
  COPY_INSIGHT_VIEW,
  props<{ id: string }>()
)

const copyInsightViewSuccess = createAction(
  COPY_INSIGHT_VIEW_SUCCESS,
  props<{ views: IInsightView[] }>()
)

const copyInsightViewFail = createAction(
  COPY_INSIGHT_VIEW_FAIL,
  props<{ error: IErrorResponse }>()
)

const shareInsightView = createAction(
  SHARE_INSIGHT_VIEW,
  props<{ id: string }>()
)

const shareInsightViewSuccess = createAction(
  SHARE_INSIGHT_VIEW_SUCCESS,
  props<{ views: IInsightView[] }>()
)

const shareInsightViewFail = createAction(
  SHARE_INSIGHT_VIEW_FAIL,
  props<{ error: IErrorResponse }>()
)

export const viewManagementActions = {
  getInsightViews,
  getInsightViewsSuccess,
  getInsightViewsFail,

  getViewManagementLayers,
  getViewManagementLayersSuccess,
  getViewManagementLayersFail,

  editInsightView,
  editInsightViewSuccess,
  editInsightViewFail,
  refreshEditingView,

  createInsightView,
  createInsightViewSuccess,
  createInsightViewFail,

  updateInsightView,
  updateInsightViewSuccess,
  updateInsightViewFail,

  deleteInsightView,
  deleteInsightViewSuccess,
  deleteInsightViewFail,

  copyInsightView,
  copyInsightViewSuccess,
  copyInsightViewFail,

  shareInsightView,
  shareInsightViewSuccess,
  shareInsightViewFail
}
