import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IViewManagementState, IInsightViewManagementState } from '../../interface';
import { featureViewManagement } from '../../constants';


const selectViewManagementState = createFeatureSelector<IViewManagementState>(
  featureViewManagement,
);

const selectInsightViewManagement = createSelector(
  selectViewManagementState,
  (state) => state.insight
);

const selectInsightViews = createSelector(
  selectInsightViewManagement,
  (state) => state.views
)

const selectInsightViewsError = createSelector(
  selectInsightViewManagement,
  (state: IInsightViewManagementState) => state?.error
)

const selectInsightViewsLoading = createSelector(
  selectInsightViewManagement,
  (state: IInsightViewManagementState) => state?.loading
)

const selectLoadingGetInsightLayer = createSelector(
  selectInsightViewManagement,
  (state: IInsightViewManagementState) => state?.gettingLayer
)

const selectInsightLayers = createSelector(
  selectInsightViewManagement,
  (state) => state.layers
)

const selectInsightLayerGroupOptions = createSelector(
  selectInsightViewManagement,
  (state) => state.layerGroupOptions
)

const selectEditingView = createSelector(
  selectInsightViewManagement,
  (state: IInsightViewManagementState) => state?.editingView
)

const selectIsUpdating = createSelector(
  selectInsightViewManagement,
  (state: IInsightViewManagementState) => state?.isUpdating
)

const selectUpdateError = createSelector(
  selectInsightViewManagement,
  (state: IInsightViewManagementState) => state?.updatingError
)

export const viewManagementSelectors = {
  selectInsightViewManagement,
  selectInsightViews,
  selectInsightViewsError,
  selectInsightViewsLoading,
  selectInsightLayers,
  selectInsightLayerGroupOptions,
  selectLoadingGetInsightLayer,
  selectEditingView,
  selectIsUpdating,
  selectUpdateError
};
