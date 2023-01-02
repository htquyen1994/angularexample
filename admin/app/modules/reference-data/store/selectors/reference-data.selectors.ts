import { createFeatureSelector, createSelector } from '@ngrx/store';
import {referenceDataFeatureKey} from '../../models';
import { ReferenceData_Feature_State } from '../reducers'

const selectState = createFeatureSelector<ReferenceData_Feature_State>(
  referenceDataFeatureKey
);

const selectReferenceDataState = createSelector(
  selectState,
  (state) => state.referenceDataState
);

const selectReferenceData = createSelector(
  selectState,
  (state) => state.referenceDataState.data
);

const selectReferenceFilter = createSelector(
  selectState,
  (state) => state.referenceDataState.filter
);

const selectReferenceSort = createSelector(
  selectState,
  (state) => state.referenceDataState.sort
);

const selectReferenceIsRefresh = createSelector(
  selectState,
  (state) => state.referenceDataState.isRefresh
);

const selectReferenceLoading = createSelector(
  selectState,
  (state) => state.referenceDataState.isLoading
);

const selectReferenceFilteredData = createSelector(
  selectState,
  (state) => state.referenceDataState.filteredData
);


export const ReferenceDataSelector = {
  selectReferenceFilter,
  selectReferenceSort,
  selectReferenceData,
  selectReferenceDataState,
  selectReferenceIsRefresh,
  selectReferenceLoading,
  selectReferenceFilteredData
}


