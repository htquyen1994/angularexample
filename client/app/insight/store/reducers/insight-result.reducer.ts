import { createReducer, on, Action } from '@ngrx/store';
import { initialInsightResultState } from '../../constants';
import { insightResultActions } from '../actions';
import { InsightResultState } from '../../interfaces';

const _insightResultReducer = createReducer(initialInsightResultState,
  on(insightResultActions.getInsightResult, (state: InsightResultState, action) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(insightResultActions.getInsightResultSuccess, (state: InsightResultState, action) => ({
    ...state,
    loading: false,
    results: action.results,
    polygons: action.polygons
  })),
  on(insightResultActions.getInsightResultFail, (state: InsightResultState, action) => ({
    ...state,
    loading: false,
    error: action.error
  })),
  on(insightResultActions.cancelGetInsightResult, (state: InsightResultState, action) => ({
    ...state,
    loading: false,
  })),
  on(insightResultActions.setFilter, (state: InsightResultState, action) => ({
    ...state,
    filterData: {
      ...state.filterData,
      [action.key]: action.value
    }
  })),

  on(insightResultActions.enableAutoRun, (state: InsightResultState, action) => ({
    ...state,
    autoRun: action.value
  })),

  on(insightResultActions.downloadInsightResult, (state: InsightResultState, action) => ({
    ...state,
    downloadLoading: true,
    error: null
  })),

  on(insightResultActions.downloadInsightResultSuccess, (state: InsightResultState, action) => ({
    ...state,
    downloadLoading: false
  })),

  on(insightResultActions.downloadInsightResultFail, (state: InsightResultState, action) => ({
    ...state,
    downloadLoading: false,
    error: action.error
  })),

  on(insightResultActions.activeInsightResult, (state: InsightResultState, action) => ({
    ...state,
    active: action.value
  })),

  on(insightResultActions.selectInsightViewSuccess, (state: InsightResultState, action) => ({
    ...state,
    selectedView: action.view
  })),

  on(insightResultActions.editPolygonLabel, (state: InsightResultState, action) => {
    const { index, label } = action;
    const polygons = state.polygons.slice();
    const polygon = state.polygons[index]
    if (!polygon) {
      return { ...state };
    }

    polygons.splice(index, 1, { ...polygon, label })
    return {
      ...state,
      polygons
    }
  }),

  on(insightResultActions.changeState, (state: InsightResultState, action) => ({
    ...state,
    state: action.state
  })),

  on(insightResultActions.createMatch, (state: InsightResultState, action) => ({
    ...state,
    createMatchLoading: true,
  })),

  on(insightResultActions.createMatchSuccess, (state: InsightResultState, action) => ({
    ...state,
    createMatchLoading: false,
    matchItLayerFilter: action.matchItLayerFilters,
    densityValues: action.densityValues
  })),

  on(insightResultActions.createMatchFail, (state: InsightResultState, action) => ({
    ...state,
    createMatchLoading: false,
    matchItLayerFilter: [],
    densityValues: []
  })),

  on(insightResultActions.previewMatchFail, (state: InsightResultState, action) => ({
    ...state,
    error: action.error
  })),
)

export function insightResultReducer(state: InsightResultState | undefined, action: Action) {
  return _insightResultReducer(state, action);
}
