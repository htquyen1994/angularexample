import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnalysisState } from '../../interfaces';
import { featureAnalysis } from '../../constants';

const selectAnalysisState = createFeatureSelector<AnalysisState>(
  featureAnalysis
);

const selectPreviewModel = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.previewModel
);

const selectLoading = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.loading
);

const selectError = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.error
);

export const analysisSelectors = {
  selectPreviewModel,
  selectLoading,
  selectError
};
