import { createReducer, on, Action } from '@ngrx/store';
import { AnalysisState } from '../../interfaces';
import { initialAnalysisState } from '../../constants';
import { analysisActions } from '../actions';

const _analysisReducer = createReducer(initialAnalysisState,
  on(analysisActions.getAnalysisPreview, (state: AnalysisState, action) => ({
    ...state,
    loading: true,
  })),
  on(analysisActions.getAnalysisPreviewSuccess, (state: AnalysisState, action) => ({
    ...state,
    loading: false,
    previewModel: action.payload
  })),
  on(analysisActions.getAnalysisPreviewFail, (state: AnalysisState, action) => ({
    ...state,
    loading: false,
    error: action.error
  })),
)

export function analysisReducer(state: AnalysisState | undefined, action: Action) {
  return _analysisReducer(state, action);
}
