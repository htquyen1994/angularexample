import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ResultPanelState, ResultPanelTabState } from '../../interfaces';
import { featureResultPanel } from '../../constants'

const selectResultPanelState = createFeatureSelector<ResultPanelState>(
  featureResultPanel
);

const selectTabState = createSelector(
  selectResultPanelState,
  (state: ResultPanelState) => state.tabState
);

const selectTabStateTabs = createSelector(
  selectTabState,
  (state: ResultPanelTabState) => state.tabs
);
const selectTabStateLoading = createSelector(
  selectTabState,
  (state: ResultPanelTabState) => state.loading
);
const selectTabStateActiveTab = createSelector(
  selectTabState,
  (state: ResultPanelTabState) => state.activeTab
);

export const resultPanelSelectors = {
  selectTabStateTabs,
  selectTabStateLoading,
  selectTabStateActiveTab,
};
