import { createReducer, on, Action } from '@ngrx/store';
import { initialAppState } from '../../constants';
import { IAppState } from '../../interfaces';
import { panelActions, layerActions, mapToolsActions } from '../actions';


const _appStateReducer = createReducer(initialAppState,
  on(panelActions.setResultPanelState, (state: IAppState, action) => ({
    ...state,
    panelSate: {
      ...state.panelSate,
      resultPanel: action.id
    }
  })),

  on(layerActions.getLayersSuccess, (state: IAppState, action) => ({
    ...state,
    layers: action.layers,
    layerGroups: action.layerGroups
  })),

  on(layerActions.getFiltersSuccess, (state: IAppState, action) => ({
    ...state,
    filters: action.filters,
  })),

  on(mapToolsActions.getShapesByPolygon, (state: IAppState, action) => ({
    ...state,
    mapToolStates: {
      ...state.mapToolStates,
      selectionMapTool: {
        loading: true
      }
    }
  })),
  on(mapToolsActions.getShapesByPolygonSuccess, (state: IAppState, action) => ({
    ...state,
    mapToolStates: {
      ...state.mapToolStates,
      selectionMapTool: {
        loading: false
      }
    }
  })),
  on(mapToolsActions.getShapesByPolygonFail, (state: IAppState, action) => ({
    ...state,
    mapToolStates: {
      ...state.mapToolStates,
      selectionMapTool: {
        loading: false
      }
    }
  })),
)

function appStateReducer(state: IAppState | undefined, action: Action) {
  return _appStateReducer(state, action);
}


export const reducers = appStateReducer
