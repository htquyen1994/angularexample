import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NearestState, NearestTool, NearestResult } from '../../interfaces';
import { featureNearest } from '../../constants';
const selectNearestFeature = createFeatureSelector<NearestState>(featureNearest);

const selectNearestTool = createSelector(
  selectNearestFeature,
  (state: NearestState) => state.tool
);

const selectNearestResult = createSelector(
  selectNearestFeature,
  (state: NearestState) => state.result
);

const selectNearestToolFilters = createSelector(
  selectNearestTool,
  (state: NearestTool) => state.filters
)

const selectNearestToolFormGroup = createSelector(
  selectNearestTool,
  (state: NearestTool) => state.formGroup
)


const selectNearestToolPointShapes = createSelector(
  selectNearestTool,
  (state: NearestTool) => state.pointShapes
)

const selectNearestResultLoading = createSelector(
  selectNearestResult,
  (state: NearestResult) => state.loading
)

const selectNearestResults = createSelector(
  selectNearestResult,
  (state: NearestResult) => state.results
)

const selectNearestResultDownLoading = createSelector(
  selectNearestResult,
  (state: NearestResult) => state.downloading
)

const selectNearestResultError = createSelector(
  selectNearestResult,
  (state: NearestResult) => state.error
)

const selectNearestResultPayload = createSelector(
  selectNearestResult,
  (state: NearestResult) => state.payload
)

const selectNearestResultColumns = createSelector(
  selectNearestResult,
  (state: NearestResult) => state.columns
)

export const nearestSelectors = {
  selectNearestToolFormGroup,
  selectNearestToolFilters,
  selectNearestToolPointShapes,
  selectNearestResultLoading,
  selectNearestResults,
  selectNearestResultDownLoading,
  selectNearestResultError,
  selectNearestResultColumns,
  selectNearestResultPayload
};
