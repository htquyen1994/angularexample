import { createSelector } from '@ngrx/store';
import { IAppState } from '../state/app.state';
import { IAccount } from '../../shared/models/account';

const accountState = (state: IAppState) => state.account;

export const selectAccount = createSelector(
  accountState,
  (state: IAccount) => state
);
