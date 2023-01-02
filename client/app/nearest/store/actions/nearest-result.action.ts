import { createAction, props } from "@ngrx/store";
import { NearestToolPayload, NearestResultColumn } from '../../interfaces';
import { IFilter, ILayer } from '@client/app/shared/interfaces';

const GETTING_NEAREST_RESULT = '[Nearest - Result] Getting nearest result';
const GETTING_NEAREST_RESULT_SUCCESS = '[Nearest - Result] Getting nearest result success';
const GETTING_NEAREST_RESULT_FAIL = '[Nearest - Result] Getting nearest result fail';

const CANCELING_GET_NEAREST_RESULT = '[Nearest - Result] Canceling get nearest result';

const CLEAR_RESULTS = '[Nearest - Result] Clear result';

const DOWNLOAD = '[Nearest - Result] Download result';
const DOWNLOAD_SUCCESS = '[Nearest - Result] Download result success';
const DOWNLOAD_FAIL = '[Nearest - Result] Download result fail';

const ZOOM_TO_FEATURE = '[Nearest - Result] Zoom to feature';
const ZOOM_All_FEATURES = '[Nearest - Result] Zoom all features';

const getNearestResult = createAction(
  GETTING_NEAREST_RESULT,
  props<{ payload: NearestToolPayload }>()
);

const getNearestResultSuccess = createAction(
  GETTING_NEAREST_RESULT_SUCCESS,
  props<{ results: any[], columns: NearestResultColumn[], payload: NearestToolPayload }>()
);

const getNearestResultFail = createAction(
  GETTING_NEAREST_RESULT_FAIL,
  props<{ error: any }>()
);

const cancelGetNearestResult = createAction(
  CANCELING_GET_NEAREST_RESULT,
);

const clearResults = createAction(
  CLEAR_RESULTS
)

const download = createAction(
  DOWNLOAD,
);

const downloadSuccess = createAction(
  DOWNLOAD_SUCCESS,
);

const downloadFail = createAction(
  DOWNLOAD_FAIL,
  props<{ error: any }>()
);

const zoomToFeature = createAction(
  ZOOM_TO_FEATURE,
  props<{shapeId: any}>()
)

const zoomAll = createAction(
  ZOOM_All_FEATURES,
)

export const nearestResultActions = {
  getNearestResult,
  getNearestResultSuccess,
  getNearestResultFail,
  clearResults,
  download,
  downloadSuccess,
  downloadFail,
  cancelGetNearestResult,
  zoomToFeature,
  zoomAll
}
