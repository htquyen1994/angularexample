import { createReducer, on, Action } from '@ngrx/store';
import { NearestResult } from '../../interfaces';
import { initialNearestResultState } from '../../constants';
import { nearestResultActions } from '../actions';


const _nearestResultReducer = createReducer(initialNearestResultState,
  on(nearestResultActions.getNearestResult, (state: NearestResult, action) => ({
    ...state,
    loading: true
  })),
  on(nearestResultActions.getNearestResultSuccess, (state: NearestResult, action) => ({
    ...state,
    loading: false,
    payload: action.payload,
    results: action.results,
    columns: action.columns
  })),
  on(nearestResultActions.getNearestResultFail, (state: NearestResult, action) => ({
    ...state,
    loading: false,
  })),
  on(nearestResultActions.clearResults, (state: NearestResult, action) => ({
    ...state,
    columns: null,
    results: null,
    payload: null
  })),
  on(nearestResultActions.download, (state: NearestResult, action) => ({
    ...state,
    downloading: true
  })),
  on(nearestResultActions.downloadSuccess, (state: NearestResult, action) => ({
    ...state,
    downloading: false
  })),
  on(nearestResultActions.downloadFail, (state: NearestResult, action) => ({
    ...state,
    downloading: false
  })),
  on(nearestResultActions.cancelGetNearestResult, (state: NearestResult, action) => ({
    ...state,
    loading: false
  })),
)

export function nearestResultReducer(state: NearestResult | undefined, action: Action) {
  return _nearestResultReducer(state, action);
}
