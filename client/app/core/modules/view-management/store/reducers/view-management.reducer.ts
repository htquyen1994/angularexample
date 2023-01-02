import { createReducer, on, Action } from '@ngrx/store';
import { viewManagementActions } from '../actions';
import { IViewManagementState } from '../../interface';
import { initialViewManagementState } from '../../constants';

const _viewManagementReducer = createReducer(initialViewManagementState,
  on(viewManagementActions.getInsightViews, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: true,
      error: null,
    }
  })),
  on(viewManagementActions.getInsightViewsSuccess, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      views: action.views,
      loading: false
    }
  })),
  on(viewManagementActions.getInsightViewsFail, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: false,
      error: action.error
    }
  })),

  on(viewManagementActions.getViewManagementLayers, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      gettingLayer: true,
      error: null,
    }
  })),
  on(viewManagementActions.getViewManagementLayersSuccess, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      layerGroupOptions:  action.layerGroupOptions,
      layers: action.layers,
      gettingLayer: false
    }
  })),
  on(viewManagementActions.getViewManagementLayersFail, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      error: action.error,
      gettingLayer: false
    }
  })),

  on(viewManagementActions.editInsightViewSuccess, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      editingView: action.view,
      error: null
    }
  })),
  on(viewManagementActions.editInsightViewFail, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      error: action.error,
    }
  })),
  on(viewManagementActions.refreshEditingView, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      editingView: null
    }
  })),
  on(viewManagementActions.createInsightView, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      isUpdating: true,
      updatingError: null
    }
  })),
  on(viewManagementActions.createInsightViewSuccess, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      isUpdating: false,
      views: action.views
    }
  })),
  on(viewManagementActions.createInsightViewFail, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      isUpdating: false,
      updatingError: action.error
    }
  })),

  on(viewManagementActions.updateInsightView, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      isUpdating: true,
      updatingError: null
    }
  })),
  on(viewManagementActions.updateInsightViewSuccess, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      isUpdating: false,
      views: action.views,
    }
  })),
  on(viewManagementActions.updateInsightViewFail, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      isUpdating: false,
      updatingError: action.error
    }
  })),

  on(viewManagementActions.deleteInsightView, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: true,
      error: null
    }
  })),
  on(viewManagementActions.deleteInsightViewSuccess, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: false,
      views: action.views,
    }
  })),
  on(viewManagementActions.deleteInsightViewFail, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: false,
      error: action.error
    }
  })),

  on(viewManagementActions.copyInsightView, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: true,
      error: null
    }
  })),
  on(viewManagementActions.copyInsightViewSuccess, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: false,
      views: action.views,
    }
  })),
  on(viewManagementActions.copyInsightViewFail, (state: IViewManagementState, action) => ({
    ...state,
    insight: {
      ...state.insight,
      loading: false,
      error: action.error
    }
  })),
)

export function viewManagementReducer(state: IViewManagementState | undefined, action: Action) {
  return _viewManagementReducer(state, action);
}
