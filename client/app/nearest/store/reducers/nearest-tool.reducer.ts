import { createReducer, on, Action } from '@ngrx/store';
import { initialNearestToolState } from '../../constants';
import { NearestTool } from '../../interfaces';
import { nearestToolActions } from '../actions';

const _nearestToolReducer = createReducer(initialNearestToolState,
  on(nearestToolActions.changeLayer, (state: NearestTool, action) => ({
    ...state,
    filters: []
  })),
  on(nearestToolActions.setFilters, (state: NearestTool, action) => ({
    ...state,
    filters: action && action.filter? action.filter.filters : []
  })),
  on(nearestToolActions.getShapes, (state: NearestTool, action) => ({
    ...state,
    pointShapes: []
  })),
  on(nearestToolActions.getShapesSuccess, (state: NearestTool, action) => ({
    ...state,
    pointShapes: action.shapes
  }))
)

export function nearestToolReducer(state: NearestTool | undefined, action: Action) {
  return _nearestToolReducer(state, action);
}
