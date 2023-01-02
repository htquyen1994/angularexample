import { createAction, props } from "@ngrx/store";
import { AnalysisPreviewPayload } from '../../interfaces'
import { IErrorResponse } from '@client/app/shared';
import { ReviewModel } from "../../../resultpanel/shared/models/match-it-review.model";
import { MatchItCriteria } from '@client/app/resultpanel/shared/models/match-it-filter.model';

const GETTING_PREVIEW_ANALYSIS = '[Analysis - PREVIEW] Getting analysis result';
const GETTING_PREVIEW_ANALYSIS_SUCCESS = '[Analysis - PREVIEW] Getting analysis result success';
const GETTING_PREVIEW_ANALYSIS_FAIL = '[Analysis - PREVIEW] Getting analysis result fail';

const getAnalysisPreview = createAction(
  GETTING_PREVIEW_ANALYSIS,
  props<{ payload: MatchItCriteria }>()
);

const getAnalysisPreviewSuccess = createAction(
  GETTING_PREVIEW_ANALYSIS_SUCCESS,
  props<{ payload: ReviewModel }>()
);

const getAnalysisPreviewFail = createAction(
  GETTING_PREVIEW_ANALYSIS_FAIL,
  props<{ error: IErrorResponse }>()
);

export const analysisActions = {
  getAnalysisPreview,
  getAnalysisPreviewSuccess,
  getAnalysisPreviewFail
}
