import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InsightResultState, InsightState } from '../../interfaces';
import { featureInsight } from '../../constants'

const selectInsightState = createFeatureSelector<InsightState>(
  featureInsight
);

const selectInsightResultState = createSelector(
  selectInsightState,
  (state: InsightState) => state.insightResult
);


const selectFilterData = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.filterData
);

const selectPolygons = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.polygons
)

const selectResults = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.results
)

const selectLoading = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.loading
)

const selectError = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.error
)

const selectAutoRun = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.autoRun
)

const selectInsightResultActive = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.active
)

const selectSelectedView = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.selectedView
)

const selectDownloadLoading = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.downloadLoading
)

const selectDownloadError = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.downloadError
)

const selectState = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.state
)

const selectMatchItLayerFilter = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.matchItLayerFilter
)

const selectMatchItdensityValues = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.densityValues
)

const selectCreateMatchLoading = createSelector(
  selectInsightResultState,
  (state: InsightResultState) => state.createMatchLoading
)

export const insightResultSelectors = {
  selectFilterData,
  selectPolygons,
  selectResults,
  selectLoading,
  selectError,
  selectAutoRun,
  selectInsightResultActive,
  selectSelectedView,
  selectDownloadLoading,
  selectDownloadError,
  selectState,
  selectMatchItLayerFilter,
  selectMatchItdensityValues,
  selectCreateMatchLoading
};
