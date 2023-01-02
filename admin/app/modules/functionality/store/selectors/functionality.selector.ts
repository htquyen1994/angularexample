import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FunctionalityState } from '../../interfaces';
import { functionalityFeature } from '../../constants';

const selectFunctionalityState = createFeatureSelector<FunctionalityState>(
  functionalityFeature
);

const selectLoading = createSelector(
  selectFunctionalityState,
  (state: FunctionalityState) => state.loading
);

const selectFilter = createSelector(
  selectFunctionalityState,
  (state: FunctionalityState) => state.filter
);

const selectError = createSelector(
  selectFunctionalityState,
  (state: FunctionalityState) => state.error
);

const selectResult = createSelector(
  selectFunctionalityState,
  (state: FunctionalityState) => state.result
);

const selectDownloading = createSelector(
  selectFunctionalityState,
  (state: FunctionalityState) => state.downloading
);

export const functionalitySelectors = {
  selectFilter,
  selectResult,
  selectLoading,
  selectError,
  selectDownloading
};
