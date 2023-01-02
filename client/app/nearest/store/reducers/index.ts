import { nearestToolReducer } from "./nearest-tool.reducer";
import { nearestResultReducer } from "./nearest-result.reducer";
import { ActionReducerMap } from '@ngrx/store';
import { NearestState } from '../../interfaces';

export const reducers: ActionReducerMap<NearestState, any> = {
  tool: nearestToolReducer,
  result: nearestResultReducer
};
