import { Action, createReducer, on } from '@ngrx/store';
import { ReferenceDataActions } from '../actions';
import { IErrorResponse, createSimpleError } from '@admin-shared/models/error';
import { ISort } from '@admin-shared/models/common-table';
import { ReferenceDataFilter, IReferenceData, ITenantsWithAccess } from '../../models';
import { IDropdownItem } from '@admin-shared/components/periscope-dropdown/periscope-dropdown';


interface ReferenceData_State {
  isRefresh: boolean;
  isLoading: boolean;
  data: {
    data: IReferenceData[],
    tenants: ITenantsWithAccess[]
  };
  filteredData: {
    data: IReferenceData[],
    tenants: ITenantsWithAccess[]
  }
  error: IErrorResponse;
  sort: ISort;
  filter: ReferenceDataFilter,
}

export interface ReferenceData_Feature_State {
  referenceDataState: ReferenceData_State,
  layerOptions: IDropdownItem[]
}

const initialState: ReferenceData_Feature_State = {
  referenceDataState: {
    isRefresh: true,
    isLoading: false,
    data: null,
    error: null,
    sort: {
      type: 'ASC',
      field: 'metadata',
      fieldChild: 'datasetName'
    },
    filter: {
      term: null,
      selectedTenants: [],
      selectedLayers: [],
      defaultBuildOnly: false
    },
    filteredData: {
      data: [],
      tenants: []
    }
  },
  layerOptions: []
};

const _referenceDataReducer = createReducer(
  initialState,

  on(ReferenceDataActions.loadReferenceDatas, state => ({
    ...state,
    referenceDataState: { ...state.referenceDataState, isLoading: true, error: null, isRefesh: false }
  })),
  on(ReferenceDataActions.loadReferenceDatasSuccess, (state, action) => ({
    ...state,
    referenceDataState: { ...state.referenceDataState, isLoading: false, error: null, data: action.data, isRefresh: false}
  })),
  on(ReferenceDataActions.loadReferenceDatasFailure, (state, action) => ({
    ...state,
    referenceDataState: { ...state.referenceDataState, isLoading: false, error: createSimpleError(action.error), }
  })),
  on(ReferenceDataActions.changeSort, (state, action) => ({
    ...state,
    referenceDataState: { ...state.referenceDataState, sort: { ...action.sort } }
  })),
  on(ReferenceDataActions.changeFilter, (state, action) => ({
    ...state,
    referenceDataState: { ...state.referenceDataState, filter: { ...action.filter } }
  })),
  on(ReferenceDataActions.updateFilterData, (state, action) => ({
    ...state,
    referenceDataState: { ...state.referenceDataState, filteredData: { ...action.data } }
  })),
);

export function referenceDataReducer(state, action) {
  return _referenceDataReducer(state, action);
}
