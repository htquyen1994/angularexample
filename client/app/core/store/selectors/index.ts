import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IPanelState, IAppState, IMapToolsState } from '../../interfaces';
import { appFeature } from '../../constants';
const selectAppFeature = createFeatureSelector<IAppState>(appFeature);

const selectPanelState = createSelector(
  selectAppFeature,
  (state: IAppState) => state.panelSate
);

const selectResultPanelState = createSelector(
  selectPanelState,
  (state: IPanelState) => state.resultPanel
);

const selectLayers = createSelector(
  selectAppFeature,
  (state: IAppState) => state.layers
);

const selectLayerGroups = createSelector(
  selectAppFeature,
  (state: IAppState) => state.layerGroups
);

const selectFilters = createSelector(
  selectAppFeature,
  (state: IAppState) => state.filters
);

const selectMapTools = createSelector(
  selectAppFeature,
  (state: IAppState) => state.mapToolStates
);

const selectMapTools_selectionMap = createSelector(
  selectMapTools,
  (state: IMapToolsState) => state.selectionMapTool
);

export const appSelectors = {
  selectResultPanelState,
  selectLayers,
  selectLayerGroups,
  selectFilters,
  selectMapTools_selectionMap
};
