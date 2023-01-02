import { createAction, props } from "@ngrx/store";
import { IInsightPolygon } from "../../interfaces";
import { IInsightView } from '@client/app/core/modules/view-management/interface';
import { EStateInsight } from '@client/app/shared/enums';
import { IErrorResponse } from '@client/app/shared';
import { MatchItLayerFilter, MatchItFilter } from '@client/app/resultpanel/shared/models/match-it-filter.model';

const GETTING_INSIGHT_RESULT = '[Insight - Result] Getting insight result';
const GETTING_INSIGHT_RESULT_SUCCESS = '[Insight - Result] Getting insight result success';
const GETTING_INSIGHT_RESULT_FAIL = '[Insight - Result] Getting insight result fail';

const CANCEL_GETTING_INSIGHT_RESULT = '[Insight - Result] Cancel getting insight result';

const SET_FILTER = '[Insight - Result] Set filter';

const ENABLE_AUTO_RUN = '[Insight - Result] Toggle auto run';

const DOWNLOAD_INSIGHT_RESULT = '[Insight - Result] Download';
const DOWNLOAD_INSIGHT_RESULT_SUCCESS = '[Insight - Result] Download Success';
const DOWNLOAD_INSIGHT_RESULT_FAIL = '[Insight - Result] Download Fail';

const OPEN_INSIGHT_RESULT = '[Insight - Result] Open result panel';

const SELECT_INSIGHT_VIEW = '[Insight - Tool] Select view';
const SELECT_INSIGHT_VIEW_SUCCESS = '[Insight - Tool] Select view success';

const EDIT_POLYGON_LABEL = '[Insight - Result] Edit polygon label';
const LOCATE_POLYGON = '[Insight - Result] Locate polygon';

const CHANGE_STATE = '[Insight - Result] Change state';

const CREATE_MATCH = '[Insight - Match] Create match';
const CREATE_MATCH_SUCCESS = '[Insight - Match] Create match success';
const CREATE_MATCH_FAIL = '[Insight - Match] Create match fail';

const PREVIEW_MATCH = '[Insight - Match] Preview match';
const PREVIEW_MATCH_FAIL = '[Insight - Match] Preview match fail';

const CLEAR_RESULTS = '[Insight - Cancel] Clear result';

const setFilter = createAction(
  SET_FILTER,
  props<{ key: string, value: any }>()
);

const getInsightResult = createAction(
  GETTING_INSIGHT_RESULT
);

const getInsightResultSuccess = createAction(
  GETTING_INSIGHT_RESULT_SUCCESS,
  props<{ results: any[], polygons: IInsightPolygon[] }>()
);

const getInsightResultFail = createAction(
  GETTING_INSIGHT_RESULT_FAIL,
  props<{ error: any }>()
);

const cancelGetInsightResult = createAction(
  CANCEL_GETTING_INSIGHT_RESULT
);

const enableAutoRun = createAction(
  ENABLE_AUTO_RUN,
  props<{ value: boolean }>()
);

const downloadInsightResult = createAction(
  DOWNLOAD_INSIGHT_RESULT,
);

const downloadInsightResultSuccess = createAction(
  DOWNLOAD_INSIGHT_RESULT_SUCCESS,
);

const downloadInsightResultFail = createAction(
  DOWNLOAD_INSIGHT_RESULT_FAIL,
  props<{ error: any }>()
);

const activeInsightResult = createAction(
  OPEN_INSIGHT_RESULT,
  props<{ value: boolean }>()
)

const selectInsightView = createAction(
  SELECT_INSIGHT_VIEW,
  props<{ id: string }>()
)

const selectInsightViewSuccess = createAction(
  SELECT_INSIGHT_VIEW_SUCCESS,
  props<{ view: IInsightView }>()
)

const editPolygonLabel = createAction(
  EDIT_POLYGON_LABEL,
  props<{ index: number, label: string }>()
)

const locatePolygon = createAction(
  LOCATE_POLYGON,
  props<{ index: number }>()
)

const changeState = createAction(
  CHANGE_STATE,
  props<{ state: EStateInsight }>()
)


const createMatch = createAction(
  CREATE_MATCH
)
const createMatchSuccess = createAction(
  CREATE_MATCH_SUCCESS,
  props<{ densityValues: any[], matchItLayerFilters: MatchItLayerFilter[] }>()
)
const createMatchFail = createAction(
  CREATE_MATCH_FAIL,
  props<{ error: IErrorResponse }>()
)

const previewMatch = createAction(
  PREVIEW_MATCH,
  props<{ formValue: any, densityValue: any }>()
)

const previewMatchFail = createAction(
  PREVIEW_MATCH_FAIL,
  props<{ error: IErrorResponse }>()
)

const clearResults = createAction(
  CLEAR_RESULTS
)

export const insightResultActions = {
  setFilter,
  enableAutoRun,
  getInsightResult,
  getInsightResultSuccess,
  getInsightResultFail,
  downloadInsightResult,
  downloadInsightResultSuccess,
  downloadInsightResultFail,
  activeInsightResult,
  selectInsightView,
  selectInsightViewSuccess,
  editPolygonLabel,
  locatePolygon,
  changeState,
  createMatch,
  createMatchSuccess,
  createMatchFail,
  previewMatch,
  previewMatchFail,
  cancelGetInsightResult,
  clearResults
}
