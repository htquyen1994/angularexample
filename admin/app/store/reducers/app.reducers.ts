import { ActionReducerMap } from '@ngrx/store';
import { IAppState } from '../state/app.state';
import { accountReducer, configReducer, masterDataReducer } from '.';

export const appReducers: ActionReducerMap<IAppState, any> = {
    account: accountReducer.reducer,
    config: configReducer.reducer,
    masterData: masterDataReducer.reducer
};
