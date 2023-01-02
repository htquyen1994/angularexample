import { createReducer, on, Action } from '@ngrx/store';
import { initialFunctionalityState } from '../../constants';
import { functionalityActions } from '../actions';
import { FunctionalityState } from '../../interfaces';

const _functionalityReducer = createReducer(initialFunctionalityState,
  on(functionalityActions.getFunctionality, (state: FunctionalityState, action) => ({
    ...state,
    loading: true,
    filter: {tenantId: action.tenantId}
  })),
  on(functionalityActions.getFunctionalitySuccess, (state: FunctionalityState, action) => ({
    ...state,
    loading: false,
    result: {
      claims: action.claims,
      data: action.data
    }
  })),
  on(functionalityActions.getFunctionalityFail, (state: FunctionalityState, action) => ({
    ...state,
    loading: false,
    error: action.error
  })),
  on(functionalityActions.downloadFunctionality, (state: FunctionalityState, action) => ({
    ...state,
    downloading: true,
  })),
  on(functionalityActions.downloadFunctionalitySuccess, (state: FunctionalityState, action) => ({
    ...state,
    downloading: false,
  })),
  on(functionalityActions.downloadFunctionalityFail, (state: FunctionalityState, action) => ({
    ...state,
    downloading: false
  })),
)

export function functionalityReducer(state: FunctionalityState | undefined, action: Action) {
  return _functionalityReducer(state, action);
}
